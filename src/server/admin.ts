"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productImages, products, variants } from "@/lib/db/schema";
import { presignUpload } from "@/lib/r2";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");
}

const presignSchema = z.object({
  productSlug: z.string().default("product"),
  files: z
    .array(z.object({ ext: z.string(), contentType: z.string() }))
    .min(1)
    .max(8),
});

/** Mint short-lived presigned PUT URLs so the browser uploads straight to R2. */
export async function presignImages(raw: unknown) {
  await requireAdmin();
  const { productSlug, files } = presignSchema.parse(raw);
  const prefix = slugify(productSlug) || "product";

  const results: { key: string; url: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    const ext =
      (files[i].ext || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const key = `products/${prefix}/${Date.now()}-${i}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const url = await presignUpload(key);
    results.push({ key, url });
  }
  return results;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  color: z.string().trim().min(1).max(60),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().max(4000).optional().default(""),
  priceRupees: z.coerce.number().positive().max(1_000_000),
  sizes: z
    .array(
      z.object({
        size: z.string().trim().min(1).max(10),
        stock: z.coerce.number().int().min(0).max(100000),
      }),
    )
    .min(1),
  imageKeys: z.array(z.string().min(1)).min(1).max(8),
  details: z.object({
    fabric: z.string().trim().optional(),
    gsm: z.coerce.number().optional(),
    fit: z.string().trim().optional(),
    neck: z.string().trim().optional(),
    sleeves: z.string().trim().optional(),
    frontPrint: z.string().trim().optional(),
    backPrint: z.string().trim().optional(),
    keyFeatures: z.array(z.string().trim()).optional(),
    washCare: z.array(z.string().trim()).optional(),
  }),
});

export async function createProduct(raw: unknown) {
  await requireAdmin();
  const data = createSchema.parse(raw);

  let slug = slugify(`${data.name} ${data.color}`);
  const clash = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
  });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const basePrice = Math.round(data.priceRupees * 100);

  const [product] = await db
    .insert(products)
    .values({
      slug,
      name: data.name,
      description: data.description,
      category: data.category,
      color: data.color,
      status: "active",
      basePrice,
      currency: "INR",
      details: data.details,
    })
    .returning({ id: products.id, slug: products.slug });

  await db.insert(variants).values(
    data.sizes.map((s, i) => ({
      productId: product.id,
      sku: `${slug}-${s.size}`.toUpperCase(),
      size: s.size,
      stockQty: s.stock,
      position: i,
    })),
  );

  await db.insert(productImages).values(
    data.imageKeys.map((key, i) => ({
      productId: product.id,
      s3Key: key,
      position: i,
      isPrimary: i === 0,
    })),
  );

  revalidatePath("/shop");
  revalidatePath("/");
  return { slug: product.slug };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  if (!productId) return;
  // Cascades to variants + images; order history is preserved (variantId set null).
  await db.delete(products).where(eq(products.id, productId));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  color: z.string().trim().min(1).max(60),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().max(4000).optional().default(""),
  priceRupees: z.coerce.number().positive().max(1_000_000),
  sizes: z
    .array(
      z.object({
        size: z.string().trim().min(1).max(10),
        stock: z.coerce.number().int().min(0).max(100000),
      }),
    )
    .min(1),
  removeImageIds: z.array(z.string()).default([]),
  newImageKeys: z.array(z.string().min(1)).default([]),
  details: z.object({
    fabric: z.string().trim().optional(),
    gsm: z.coerce.number().optional(),
    fit: z.string().trim().optional(),
    neck: z.string().trim().optional(),
    sleeves: z.string().trim().optional(),
    frontPrint: z.string().trim().optional(),
    backPrint: z.string().trim().optional(),
    keyFeatures: z.array(z.string().trim()).optional(),
    washCare: z.array(z.string().trim()).optional(),
  }),
});

export async function updateProduct(raw: unknown) {
  await requireAdmin();
  const data = updateSchema.parse(raw);

  const product = await db.query.products.findFirst({
    where: eq(products.id, data.id),
    columns: { id: true, slug: true },
  });
  if (!product) throw new Error("Product not found");

  await db
    .update(products)
    .set({
      name: data.name,
      description: data.description,
      category: data.category,
      color: data.color,
      basePrice: Math.round(data.priceRupees * 100),
      details: data.details,
      updatedAt: new Date(),
    })
    .where(eq(products.id, product.id));

  // --- Sync variants (match by size) ---
  const existingVariants = await db.query.variants.findMany({
    where: eq(variants.productId, product.id),
  });
  const desiredSizes = new Set(data.sizes.map((s) => s.size));

  for (const v of existingVariants) {
    if (!desiredSizes.has(v.size)) {
      await db.delete(variants).where(eq(variants.id, v.id));
    }
  }
  for (let i = 0; i < data.sizes.length; i++) {
    const s = data.sizes[i];
    const existing = existingVariants.find((v) => v.size === s.size);
    if (existing) {
      await db
        .update(variants)
        .set({ stockQty: s.stock, position: i })
        .where(eq(variants.id, existing.id));
    } else {
      await db.insert(variants).values({
        productId: product.id,
        sku: `${product.slug}-${s.size}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
        size: s.size,
        stockQty: s.stock,
        position: i,
      });
    }
  }

  // --- Sync images ---
  if (data.removeImageIds.length > 0) {
    await db
      .delete(productImages)
      .where(
        and(
          eq(productImages.productId, product.id),
          inArray(productImages.id, data.removeImageIds),
        ),
      );
  }
  if (data.newImageKeys.length > 0) {
    const remaining = await db.query.productImages.findMany({
      where: eq(productImages.productId, product.id),
      columns: { position: true },
    });
    const startPos =
      remaining.reduce((max, r) => Math.max(max, r.position), -1) + 1;
    await db.insert(productImages).values(
      data.newImageKeys.map((key, i) => ({
        productId: product.id,
        s3Key: key,
        position: startPos + i,
        isPrimary: false,
      })),
    );
  }
  // Guarantee exactly one primary image.
  const imgs = await db.query.productImages.findMany({
    where: eq(productImages.productId, product.id),
    orderBy: [asc(productImages.position)],
    columns: { id: true, isPrimary: true },
  });
  if (imgs.length > 0 && !imgs.some((im) => im.isPrimary)) {
    await db
      .update(productImages)
      .set({ isPrimary: true })
      .where(eq(productImages.id, imgs[0].id));
  }

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin/products");
  return { slug: product.slug };
}
