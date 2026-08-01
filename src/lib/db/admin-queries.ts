import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";

export async function getOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: { items: true },
  });
}

export async function getAdminProducts() {
  return db.query.products.findMany({
    orderBy: [desc(products.createdAt)],
    with: { images: { columns: { s3Key: true, isPrimary: true } } },
  });
}

export async function getRevenueSummary() {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','fulfilled') then ${orders.total} else 0 end), 0)`,
      paidCount: sql<number>`count(*) filter (where ${orders.status} in ('paid','fulfilled'))`,
      totalCount: sql<number>`count(*)`,
    })
    .from(orders);

  return {
    revenue: Number(row?.revenue ?? 0),
    paidCount: Number(row?.paidCount ?? 0),
    totalCount: Number(row?.totalCount ?? 0),
  };
}

export async function getRecentOrders(limit = 50) {
  return db.query.orders.findMany({
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
