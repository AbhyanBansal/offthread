"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { SizeChart } from "@/components/shop/size-chart";
import { ReturnPolicy } from "@/components/shop/return-policy";

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-mono text-xs uppercase tracking-[0.2em]">
          {title}
        </span>
        {open ? (
          <Minus className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <Plus className="h-4 w-4 shrink-0 text-muted" />
        )}
      </button>
      {open ? <div className="pb-5">{children}</div> : null}
    </div>
  );
}

export function ProductAccordions() {
  return (
    <div className="mt-8 border-t border-border">
      <AccordionItem title="Size chart">
        <SizeChart />
      </AccordionItem>
      <AccordionItem title="Returns & exchanges">
        <ReturnPolicy />
      </AccordionItem>
    </div>
  );
}
