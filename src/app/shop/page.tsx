import Link from "next/link";
import { getActiveProducts, getFilterFacets } from "@/lib/db/queries";
import { ProductCard } from "@/components/shop/product-card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Shop all" };

type SearchParams = Promise<{
  category?: string;
  color?: string;
  size?: string;
}>;

type Active = { category?: string; color?: string; size?: string };

function hrefFor(active: Active, key: keyof Active, value: string) {
  const next: Active = { ...active };
  next[key] = next[key] === value ? undefined : value;
  const qs = new URLSearchParams(
    Object.entries(next).filter(([, v]) => Boolean(v)) as [string, string][],
  ).toString();
  return qs ? `/shop?${qs}` : "/shop";
}

function FilterRow({
  label,
  values,
  paramKey,
  active,
}: {
  label: string;
  values: string[];
  paramKey: keyof Active;
  active: Active;
}) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      {values.map((v) => {
        const isActive = active[paramKey] === v;
        return (
          <Link
            key={v}
            href={hrefFor(active, paramKey, v)}
            className={cn(
              "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:border-foreground hover:text-foreground",
            )}
          >
            {v}
          </Link>
        );
      })}
    </div>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const active: Active = {
    category: sp.category,
    color: sp.color,
    size: sp.size,
  };

  const [items, facets] = await Promise.all([
    getActiveProducts(active),
    getFilterFacets(),
  ]);

  const hasFilters = Boolean(active.category || active.color || active.size);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
          Shop all
        </h1>
        <span className="font-mono text-xs text-muted">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </span>
      </div>

      {/* Auto-rendered filters */}
      <div className="mt-6 space-y-3">
        <FilterRow
          label="Category"
          values={facets.categories}
          paramKey="category"
          active={active}
        />
        <FilterRow
          label="Color"
          values={facets.colors}
          paramKey="color"
          active={active}
        />
        <FilterRow
          label="Size"
          values={facets.sizes}
          paramKey="size"
          active={active}
        />
        {hasFilters ? (
          <Link
            href="/shop"
            className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-accent hover:underline"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted">
            {hasFilters ? "Nothing matches those filters" : "Drop coming soon"}
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
