import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, productImages, products, variants } from "@/lib/db/schema";
import { notDroppedOrder } from "@/lib/db/queries";

export async function getOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.orderNumber, orderNumber), notDroppedOrder()),
    with: { items: true },
  });
}

export async function getAdminProducts() {
  return db.query.products.findMany({
    orderBy: [desc(products.createdAt)],
    with: { images: { columns: { s3Key: true, isPrimary: true } } },
  });
}

/** Full product (images + variants) for the admin edit form. */
export async function getAdminProductById(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: [asc(productImages.position)] },
      variants: { orderBy: [asc(variants.position)] },
    },
  });
}

export async function getRevenueSummary() {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','fulfilled') then ${orders.total} else 0 end), 0)`,
      paidCount: sql<number>`count(*) filter (where ${orders.status} in ('paid','fulfilled'))`,
      totalCount: sql<number>`count(*)`,
    })
    .from(orders)
    .where(notDroppedOrder());

  return {
    revenue: Number(row?.revenue ?? 0),
    paidCount: Number(row?.paidCount ?? 0),
    totalCount: Number(row?.totalCount ?? 0),
  };
}

export async function getRecentOrders(limit = 50) {
  return db.query.orders.findMany({
    where: notDroppedOrder(),
    orderBy: [desc(orders.createdAt)],
    limit,
    columns: {
      orderNumber: true,
      email: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });
}
