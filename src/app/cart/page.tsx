import Link from "next/link";
import { getCart } from "@/server/cart";
import { formatPaise } from "@/lib/money";
import { CartItemRow } from "@/components/shop/cart-item-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bounceAdminToDashboard } from "@/lib/guard";

export const metadata = { title: "Bag" };

export default async function CartPage() {
  await bounceAdminToDashboard();
  const cart = await getCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
        Bag
      </h1>

      {cart.items.length === 0 ? (
        <div className="mt-12 border border-border p-12 text-center">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
            Your bag is empty
          </p>
          <Link
            href="/shop"
            className={cn(buttonVariants({ variant: "primary" }), "mt-6")}
          >
            Shop the drop
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-border border-y border-border">
            {cart.items.map((item) => (
              <li key={item.id} className="py-6">
                <CartItemRow item={item} />
              </li>
            ))}
          </ul>

          <aside className="h-fit border border-border p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Summary
            </h2>
            <div className="mt-6 flex items-baseline justify-between font-mono text-sm">
              <span>Subtotal</span>
              <span>{formatPaise(cart.subtotal)}</span>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              Shipping calculated at checkout
            </p>
            <Link
              href="/checkout"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "mt-6 w-full",
              )}
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
