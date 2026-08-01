import Link from "next/link";
import { formatPaise } from "@/lib/money";

type Order = {
  orderNumber: string;
  email: string;
  total: number;
  status: string;
  createdAt: Date;
};

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        No orders yet
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            <th className="py-3 pr-4">Order</th>
            <th className="py-3 pr-4">Email</th>
            <th className="py-3 pr-4">Total</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3">Date</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {orders.map((o) => (
            <tr key={o.orderNumber} className="border-b border-border/50">
              <td className="py-3 pr-4">
                <Link
                  href={`/admin/orders/${o.orderNumber}`}
                  className="hover:text-accent"
                >
                  {o.orderNumber}
                </Link>
              </td>
              <td className="py-3 pr-4 text-muted">{o.email}</td>
              <td className="py-3 pr-4">{formatPaise(o.total)}</td>
              <td className="py-3 pr-4 uppercase tracking-[0.15em] text-muted">
                {o.status}
              </td>
              <td className="py-3 text-muted">
                {new Date(o.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
