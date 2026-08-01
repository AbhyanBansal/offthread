"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SizeChart } from "@/components/shop/size-chart";

export function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Size guide
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg border border-border bg-surface p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl uppercase leading-none">
                Size guide
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">
              <SizeChart />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
