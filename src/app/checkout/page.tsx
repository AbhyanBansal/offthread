import { redirect } from "next/navigation";
import { getCart } from "@/server/cart";
import { auth } from "@/lib/auth";
import { getDefaultAddress } from "@/lib/db/queries";
import { computeShipping, formatPaise } from "@/lib/money";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { bounceAdminToDashboard } from "@/lib/guard";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  await bounceAdminToDashboard();
  const cart = await getCart();
  if (cart.items.length === 0) redirect("/cart");

  const subtotal = cart.subtotal;
  const shippingFee = computeShipping(subtotal);
  const total = subtotal + shippingFee;

  // Prefill for signed-in customers: name/email from the account, address from
  // their saved default (if any).
  const session = await auth();
  let initial: Record<string, string> | undefined;
  let hasSaved = false;
  if (session?.user) {
    const saved = await getDefaultAddress(session.user.id);
    initial = {
      name: saved?.name ?? session.user.name ?? "",
      email: session.user.email ?? "",
      phone: saved?.phone ?? "",
      line1: saved?.line1 ?? "",
      line2: saved?.line2 ?? "",
      city: saved?.city ?? "",
      state: saved?.state ?? "",
      pincode: saved?.pincode ?? "",
    };
    hasSaved = Boolean(saved);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
        Checkout
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <CheckoutForm
          total={total}
          initial={initial}
          hasSaved={hasSaved}
          lockEmail={Boolean(session?.user)}
        />

        <aside className="h-fit border border-border p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Order
          </h2>
          <ul className="mt-4 space-y-3">
            {cart.items.map((it) => (
              <li
                key={it.id}
                className="flex justify-between gap-3 font-mono text-xs"
              >
                <span className="text-muted">
                  {it.name} · {it.size} × {it.qty}
                </span>
                <span>{formatPaise(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-border pt-4 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPaise(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>{shippingFee === 0 ? "Free" : formatPaise(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <span>Total</span>
              <span>{formatPaise(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
