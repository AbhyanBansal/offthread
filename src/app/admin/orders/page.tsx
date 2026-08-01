import { getRecentOrders } from "@/lib/db/admin-queries";
import { OrdersTable } from "@/components/admin/orders-table";

export default async function AdminOrdersPage() {
  const orders = await getRecentOrders(200);

  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        All orders ({orders.length})
      </h2>
      <div className="mt-4">
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
