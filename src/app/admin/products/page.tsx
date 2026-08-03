import Link from "next/link";
import { getAdminProducts } from "@/lib/db/admin-queries";
import { formatPaise } from "@/lib/money";
import { imageUrl } from "@/lib/cdn";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Products ({products.length})
        </h2>
        <Link
          href="/admin/products/new"
          className="font-mono text-xs uppercase tracking-[0.2em] text-accent hover:underline"
        >
          + New
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 border border-border p-10 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            No products yet
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {products.map((p) => {
            const primary =
              p.images.find((i) => i.isPrimary) ?? p.images[0];
            return (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <div className="h-16 w-12 shrink-0 overflow-hidden bg-surface">
                  {primary ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl(primary.s3Key)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${p.slug}`}
                    className="font-mono text-xs uppercase tracking-[0.12em] hover:text-accent"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                    {[p.category, p.color, p.status]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="font-mono text-xs">
                  {formatPaise(p.basePrice)}
                </span>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
                >
                  Edit
                </Link>
                <DeleteProductButton id={p.id} name={p.name} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
