"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { getCartCount } from "@/server/cart";

const NAV = [
  { label: "Shop all", href: "/shop" },
  { label: "About", href: "/about" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => getCartCount().then(setCount).catch(() => {});
    load();
    window.addEventListener("cart:updated", load);
    return () => window.removeEventListener("cart:updated", load);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="OFFTHREAD — home"
          className="flex h-11 items-center overflow-hidden sm:h-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="OFFTHREAD"
            className="w-40 max-w-none sm:w-48"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/account"
            aria-label="Account"
            className="text-muted transition-colors hover:text-foreground"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative text-muted transition-colors hover:text-foreground"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {count > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold leading-none text-accent-foreground">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="text-muted transition-colors hover:text-foreground md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <nav className="flex flex-col px-4 py-2">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/50 py-4 font-mono text-sm uppercase tracking-[0.2em] last:border-b-0"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
