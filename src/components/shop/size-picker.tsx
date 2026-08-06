"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/server/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = { id: string; size: string; stockQty: number };

export function SizePicker({
  variants,
  headerAction,
}: {
  variants: Variant[];
  headerAction?: React.ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  const allOutOfStock = variants.every((v) => v.stockQty <= 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Size
        </p>
        {headerAction}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {variants.map((v) => {
          const oos = v.stockQty <= 0;
          const active = selected === v.id;
          return (
            <button
              key={v.id}
              type="button"
              disabled={oos}
              aria-pressed={active}
              onClick={() => {
                setSelected(v.id);
                setAdded(false);
              }}
              className={cn(
                "min-w-12 border px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground",
                oos &&
                  "cursor-not-allowed text-muted line-through hover:border-border",
              )}
            >
              {v.size}
            </button>
          );
        })}
      </div>

      <Button
        className="mt-6 w-full"
        disabled={!selected || pending || allOutOfStock}
        onClick={() => {
          if (!selected) return;
          startTransition(async () => {
            await addToCart(selected);
            setAdded(true);
            window.dispatchEvent(new Event("cart:updated"));
          });
        }}
      >
        {allOutOfStock
          ? "Sold out"
          : pending
            ? "Adding…"
            : added
              ? "Added to bag ✓"
              : "Add to bag"}
      </Button>
    </div>
  );
}
