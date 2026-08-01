import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = { title: "Admin" };

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "New product", href: "/admin/products/new" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — the proxy also gates /admin by role.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl uppercase leading-none">
          Admin<span className="text-accent">.</span>
        </h1>
        <nav className="flex gap-6 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
