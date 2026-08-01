import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/lib/db/admin-queries";
import { formatPaise } from "@/lib/money";

type Params = { params: Promise<{ orderNumber: string }> };

export default async function AdminOrderDetail({ params }: Params) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const a = order.shippingAddress;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/orders"
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted hover:text-foreground"
      >
        ← Orders
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h2 className="font-mono text-sm">{order.orderNumber}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {order.status}
        </span>
      </div>

      <div className="mt-6 border border-border p-5">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Ship to
        </h3>
        {a ? (
          <div className="mt-3 space-y-1 font-mono text-xs">
            <p className="text-sm">{a.name}</p>
            <p className="text-muted">{a.phone}</p>
            <p className="text-muted">{order.email}</p>
            <p className="mt-2">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
            </p>
            <p>
              {a.city}, {a.state} {a.pincode}
            </p>
            <p>{a.country}</p>
          </div>
        ) : (
          <p className="mt-3 font-mono text-xs text-muted">
            No address on file ({order.email})
          </p>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Items
        </h3>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {order.items.map((it) => (
            <li
              key={it.id}
              className="flex justify-between gap-3 py-3 font-mono text-xs"
            >
              <span>
                {it.productName} · {it.variantLabel} × {it.qty}
              </span>
              <span>{formatPaise(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 font-mono text-xs">
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
          <div className="flex justify-between border-t border-border pt-2 text-sm">
            <span>Total</span>
            <span>{formatPaise(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
