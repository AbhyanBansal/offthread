import { notFound } from "next/navigation";
import { getAdminProductById } from "@/lib/db/admin-queries";
import { ProductEditForm } from "@/components/admin/product-edit-form";

type Params = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getAdminProductById(id);
  if (!product) notFound();

  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Edit — {product.name}
      </h2>
      <div className="mt-6">
        <ProductEditForm
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            category: product.category,
            color: product.color,
            basePrice: product.basePrice,
            details: product.details,
            images: product.images.map((im) => ({
              id: im.id,
              s3Key: im.s3Key,
              isPrimary: im.isPrimary,
            })),
            variants: product.variants.map((v) => ({
              id: v.id,
              size: v.size,
              stockQty: v.stockQty,
            })),
          }}
        />
      </div>
    </div>
  );
}
