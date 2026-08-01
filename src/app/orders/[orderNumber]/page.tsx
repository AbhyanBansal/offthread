import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { formatPaise } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Order confirmed" };

type Params = { params: Promise<{ orderNumber: string }> };

export default async function OrderPage({ params }: Params) {
  const { orderNumber } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: { items: true },
  });
  if (!order) notFound();

  const paid = order.status === "paid" || order.status === "fulfilled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
        {paid ? "Payment received" : "Order pending"}
      </p>
      <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">
        Thank you
      </h1>
      <p className="mt-4 font-mono text-sm text-muted">
        Order {order.orderNumber}
      </p>

      <ul className="mt-10 divide-y divide-border border-y border-border">
        {order.items.map((it) => (
          <li
            key={it.id}
            className="flex justify-between gap-3 py-4 font-mono text-xs"
          >
            <span>
              {it.productName} · {it.variantLabel} × {it.qty}
            </span>
            <span>{formatPaise(it.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 font-mono text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatPaise(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Shipping</span>
          <span>
            {order.shippingFee === 0 ? "Free" : formatPaise(order.shippingFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base">
          <span>Total</span>
          <span>{formatPaise(order.total)}</span>
        </div>
      </div>

      <Link
        href="/shop"
        className={cn(buttonVariants({ variant: "outline" }), "mt-10")}
      >
        Continue shopping
      </Link>
    </div>
  );
}
