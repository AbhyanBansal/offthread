import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { getDefaultAddress, getUserOrders } from "@/lib/db/queries";
import { formatPaise } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/account/address-form";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();

  // Admins never shop — send them to the dashboard.
  if (session?.user?.role === "admin") redirect("/admin");

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-5xl uppercase leading-none">Account</h1>
        <p className="mt-4 text-sm text-muted">
          Sign in to track orders and save your details.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/account" });
          }}
        >
          <Button className="mt-8 w-full" size="lg" type="submit">
            Continue with Google
          </Button>
        </form>
      </div>
    );
  }

  const [userOrders, savedAddress] = await Promise.all([
    getUserOrders(session.user.id),
    getDefaultAddress(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-5xl uppercase leading-none">Account</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>

      <p className="mt-6 font-mono text-sm">
        {session.user.name} · {session.user.email}
      </p>

      {/* Editable details */}
      <div className="mt-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Your details
        </h2>
        <p className="mt-2 font-mono text-[11px] text-muted">
          Used to prefill checkout — update anytime.
        </p>
        <div className="mt-5">
          <AddressForm
            initial={{
              name: savedAddress?.name ?? session.user.name ?? "",
              phone: savedAddress?.phone ?? "",
              line1: savedAddress?.line1 ?? "",
              line2: savedAddress?.line2 ?? "",
              city: savedAddress?.city ?? "",
              state: savedAddress?.state ?? "",
              pincode: savedAddress?.pincode ?? "",
            }}
          />
        </div>
      </div>

      {/* Orders */}
      <div className="mt-14">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Orders
        </h2>

        {userOrders.length === 0 ? (
          <div className="mt-4 border border-border p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              No orders yet
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {userOrders.map((o) => (
              <li key={o.orderNumber}>
                <Link
                  href={`/orders/${o.orderNumber}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-accent"
                >
                  <div>
                    <p className="font-mono text-xs">{o.orderNumber}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs">{formatPaise(o.total)}</p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                      {o.status}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
