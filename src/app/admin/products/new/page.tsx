import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        New listing
      </h2>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
