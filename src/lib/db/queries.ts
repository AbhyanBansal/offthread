import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  addresses,
  orders,
  productImages,
  products,
  variants,
} from "@/lib/db/schema";

/** Active products (optionally filtered), with images + variants, newest first. */
export async function getActiveProducts(filters?: {
  category?: string;
  color?: string;
  size?: string;
}) {
  const conds = [eq(products.status, "active")];
  if (filters?.category) conds.push(eq(products.category, filters.category));
  if (filters?.color) conds.push(eq(products.color, filters.color));

  const rows = await db.query.products.findMany({
    where: and(...conds),
    orderBy: [desc(products.createdAt)],
    with: {
      images: { orderBy: [asc(productImages.position)] },
      variants: { orderBy: [asc(variants.position)] },
    },
  });

  // Size is a variant attribute — filter in-app (catalog is small).
  if (filters?.size) {
    return rows.filter((p) => p.variants.some((v) => v.size === filters.size));
  }
  return rows;
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "OS"];

/** Distinct categories / colors / sizes across active products — for filters. */
export async function getFilterFacets() {
  const rows = await db.query.products.findMany({
    where: eq(products.status, "active"),
    columns: { category: true, color: true },
    with: { variants: { columns: { size: true } } },
  });

  const categories = new Set<string>();
  const colors = new Set<string>();
  const sizes = new Set<string>();
  for (const p of rows) {
    if (p.category) categories.add(p.category);
    if (p.color) colors.add(p.color);
    for (const v of p.variants) sizes.add(v.size);
  }

  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    colors: [...colors].sort((a, b) => a.localeCompare(b)),
    sizes: [...sizes].sort(
      (a, b) =>
        (SIZE_ORDER.indexOf(a) === -1 ? 99 : SIZE_ORDER.indexOf(a)) -
        (SIZE_ORDER.indexOf(b) === -1 ? 99 : SIZE_ORDER.indexOf(b)),
    ),
  };
}

/** A single product by slug, with images + variants. */
export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      images: { orderBy: [asc(productImages.position)] },
      variants: { orderBy: [asc(variants.position)] },
    },
  });
}

/** The saved shipping address for a user (used to prefill checkout). */
export async function getDefaultAddress(userId: string) {
  return db.query.addresses.findFirst({
    where: eq(addresses.userId, userId),
  });
}

/** Order history for a logged-in user, newest first. */
export async function getUserOrders(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    columns: {
      orderNumber: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });
}

export type ProductListItem = Awaited<
  ReturnType<typeof getActiveProducts>
>[number];
export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;
