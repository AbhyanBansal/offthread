import { getRecentOrders, getRevenueSummary } from "@/lib/db/admin-queries";
import { OrdersTable } from "@/components/admin/orders-table";
import { formatPaise } from "@/lib/money";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl leading-none">{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([
    getRevenueSummary(),
    getRecentOrders(8),
  ]);

  return (
    <div className="space-y-12">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue (paid)" value={formatPaise(stats.revenue)} />
        <Stat label="Paid orders" value={String(stats.paidCount)} />
        <Stat label="Total orders" value={String(stats.totalCount)} />
      </div>

      <div>
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Recent orders
        </h2>
        <div className="mt-4">
          <OrdersTable orders={recent} />
        </div>
      </div>
    </div>
  );
}
