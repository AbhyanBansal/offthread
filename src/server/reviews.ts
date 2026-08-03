"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { presignUpload } from "@/lib/r2";
import { slugify } from "@/lib/utils";

const MAX_WORDS = 50;

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Please sign in to leave a review.");
  return session.user;
}

const presignSchema = z.object({
  productId: z.string().min(1),
  files: z
    .array(z.object({ ext: z.string(), contentType: z.string() }))
    .min(1)
    .max(2),
});

/** Presigned PUT URLs for review photos (logged-in customers). */
export async function presignReviewImages(raw: unknown) {
  const user = await requireUser();
  const { productId, files } = presignSchema.parse(raw);

  const results: { key: string; url: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    const ext =
      (files[i].ext || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const key = `reviews/${slugify(productId)}/${user.id}-${Date.now()}-${i}-${Math.random()
      .toString(36)
      .slice(2, 6)}.${ext}`;
    results.push({ key, url: await presignUpload(key) });
  }
  return results;
}

const submitSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional().default(""),
  photoKeys: z.array(z.string().min(1)).max(2).default([]),
});

/** Create or update the caller's review for a product (one per user). */
export async function submitReview(raw: unknown) {
  const user = await requireUser();
  const data = submitSchema.parse(raw);

  const words = data.body.split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) {
    throw new Error(`Review must be ${MAX_WORDS} words or fewer.`);
  }

  await db
    .insert(reviews)
    .values({
      productId: data.productId,
      userId: user.id,
      rating: data.rating,
      body: data.body || null,
      photos: data.photoKeys.length > 0 ? data.photoKeys : null,
    })
    .onConflictDoUpdate({
      target: [reviews.productId, reviews.userId],
      set: {
        rating: data.rating,
        body: data.body || null,
        photos: data.photoKeys.length > 0 ? data.photoKeys : null,
        createdAt: new Date(),
      },
    });

  revalidatePath(`/products/${data.slug}`);
  return { ok: true as const };
}
