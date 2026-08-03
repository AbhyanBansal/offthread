import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/db/queries";
import { formatPaise } from "@/lib/money";
import { SizePicker } from "@/components/shop/size-picker";
import { ProductGallery } from "@/components/shop/product-gallery";
import { SizeGuideModal } from "@/components/shop/size-guide-modal";
import { ProductAccordions } from "@/components/shop/product-accordions";
import { ReviewsSection } from "@/components/shop/reviews-section";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "active") notFound();

  const d = product.details ?? {};
  const specs: [string, string][] = (
    [
      ["Brand", "OFFTHREAD"],
      ["Product", product.category ?? ""],
      ["Color", product.color ?? ""],
      ["Fabric", d.fabric ?? ""],
      ["Fabric weight", d.gsm ? `${d.gsm} GSM` : ""],
      ["Fit", d.fit ?? ""],
      ["Neck", d.neck ?? ""],
      ["Sleeves", d.sleeves ?? ""],
      ["Front", d.frontPrint ?? ""],
      ["Back", d.backPrint ?? ""],
    ] as [string, string][]
  ).filter(([, v]) => Boolean(v));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
            {[product.category, product.color].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 font-mono text-lg">
            {formatPaise(product.basePrice)}
          </p>
          {product.description ? (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          ) : null}

          <div className="mt-8 max-w-md">
            <SizePicker
              headerAction={<SizeGuideModal />}
              variants={product.variants.map((v) => ({
                id: v.id,
                size: v.size,
                stockQty: v.stockQty,
              }))}
            />
            <ProductAccordions />
          </div>
        </div>
      </div>

      {/* Structured details */}
      <div className="mt-16 grid gap-12 border-t border-border pt-12 lg:grid-cols-2">
        {specs.length > 0 ? (
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Product details
            </h3>
            <dl className="mt-3 border-y border-border/60">
              {specs.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-border/40 py-2.5 font-mono text-xs last:border-b-0"
                >
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="space-y-10">
          {d.keyFeatures && d.keyFeatures.length > 0 ? (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Key features
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-foreground/85">
                {d.keyFeatures.map((k, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">—</span>
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {d.washCare && d.washCare.length > 0 ? (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Wash care
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {d.washCare.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <ReviewsSection productId={product.id} slug={product.slug} />
    </div>
  );
}
