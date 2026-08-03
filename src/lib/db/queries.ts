import "server-only";
import { and, asc, desc, eq, gt, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  addresses,
  orders,
  productImages,
  products,
  reviews,
  variants,
} from "@/lib/db/schema";

/**
 * An order that never completed payment within 10 minutes is treated as
 * "dropped" — it must not appear to the customer or in the admin panel.
 * Visible orders are those that aren't pending, or are still within the grace
 * window.
 */
export function notDroppedOrder() {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  return or(ne(orders.status, "pending"), gt(orders.createdAt, cutoff));
}

/** A single order by number, only if it hasn't been dropped. */
export async function getVisibleOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.orderNumber, orderNumber), notDroppedOrder()),
    with: { items: true },
  });
}

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
    where: and(eq(orders.userId, userId), notDroppedOrder()),
    orderBy: [desc(orders.createdAt)],
    columns: {
      orderNumber: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });
}

/** Reviews for a product (newest first) with the reviewer's name + summary. */
export async function getProductReviews(productId: string) {
  const rows = await db.query.reviews.findMany({
    where: eq(reviews.productId, productId),
    orderBy: [desc(reviews.createdAt)],
    with: { user: { columns: { name: true, image: true } } },
  });
  const count = rows.length;
  const avg = count ? rows.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  return { reviews: rows, count, avg };
}

export type ProductListItem = Awaited<
  ReturnType<typeof getActiveProducts>
>[number];
export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;
