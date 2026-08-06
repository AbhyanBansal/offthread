"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Minus, Plus, X } from "lucide-react";
import { removeCartItem, updateCartItem } from "@/server/cart";
import { imageUrl } from "@/lib/cdn";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  slug: string;
  size: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  s3Key: string | null;
  stockQty: number;
};

export function CartItemRow({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();

  const setQty = (qty: number) =>
    startTransition(async () => {
      await updateCartItem(item.id, qty);
      window.dispatchEvent(new Event("cart:updated"));
    });

  const remove = () =>
    startTransition(async () => {
      await removeCartItem(item.id);
      window.dispatchEvent(new Event("cart:updated"));
    });

  const atMax = item.qty >= item.stockQty;

  return (
    <div className={cn("flex gap-4", pending && "opacity-60")}>
      <Link
        href={`/products/${item.slug}`}
        className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-surface"
      >
        {item.s3Key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(item.s3Key)}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center px-1 text-center font-display text-[10px] uppercase leading-none text-border">
            {item.name}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/products/${item.slug}`}
              className="font-mono text-xs uppercase tracking-[0.12em] hover:text-accent"
            >
              {item.name}
            </Link>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Size {item.size}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Remove item"
            className="text-muted transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-center border border-border">
            <button
              type="button"
              onClick={() => setQty(item.qty - 1)}
              disabled={pending}
              aria-label="Decrease quantity"
              className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center font-mono text-xs">{item.qty}</span>
            <button
              type="button"
              onClick={() => setQty(item.qty + 1)}
              disabled={pending || atMax}
              aria-label="Increase quantity"
              className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="font-mono text-sm">{formatPaise(item.lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}
