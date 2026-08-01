import Link from "next/link";
import { imageUrl } from "@/lib/cdn";
import { formatPaise } from "@/lib/money";
import type { ProductListItem } from "@/lib/db/queries";

export function ProductCard({ product }: { product: ProductListItem }) {
  const primary =
    product.images.find((img) => img.isPrimary) ?? product.images[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        {primary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(primary.s3Key)}
            alt={primary.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <span className="text-center font-display text-2xl uppercase leading-none text-border">
              {product.name}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-xs uppercase tracking-[0.12em] transition-colors group-hover:text-accent">
          {product.name}
        </h3>
        <span className="shrink-0 font-mono text-xs text-muted">
          {formatPaise(product.basePrice)}
        </span>
      </div>
      {product.category ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {product.category}
        </p>
      ) : null}
    </Link>
  );
}
