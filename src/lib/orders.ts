import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, variants } from "@/lib/db/schema";

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OT-${ts}-${rand}`;
}

/**
 * Idempotently mark an order paid and decrement stock.
 *
 * The conditional update (status = 'pending') guarantees the transition runs at
 * most once, even if both the client callback and the Razorpay webhook fire.
 * Returns true only for the call that actually fulfilled the order.
 */
export async function fulfillOrder(orderId: string): Promise<boolean> {
  const [updated] = await db
    .update(orders)
    .set({ status: "paid", updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });

  if (!updated) return false; // already fulfilled elsewhere

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
    columns: { variantId: true, qty: true },
  });

  for (const item of items) {
    if (!item.variantId) continue;
    await db
      .update(variants)
      .set({ stockQty: sql`greatest(${variants.stockQty} - ${item.qty}, 0)` })
      .where(eq(variants.id, item.variantId));
  }

  return true;
}
