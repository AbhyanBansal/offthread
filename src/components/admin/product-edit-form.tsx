"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProduct, presignImages } from "@/server/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { imageUrl } from "@/lib/cdn";
import type { ProductDetails } from "@/lib/db/schema";

const DEFAULT_SIZES = ["M", "L", "XL"];

const INPUT =
  "w-full border border-border bg-surface px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none";
const LABEL = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted";

type EditProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  color: string | null;
  basePrice: number;
  details: ProductDetails | null;
  images: { id: string; s3Key: string; isPrimary: boolean }[];
  variants: { id: string; size: string; stockQty: number }[];
};

type SizeRow = { size: string; enabled: boolean; stock: number };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

export function ProductEditForm({ product }: { product: EditProduct }) {
  const router = useRouter();
  const d = product.details ?? {};

  const [f, setF] = useState({
    name: product.name,
    color: product.color ?? "",
    category: product.category ?? "",
    price: String(Math.round(product.basePrice / 100)),
    description: product.description ?? "",
    fabric: d.fabric ?? "",
    gsm: d.gsm ? String(d.gsm) : "",
    fit: d.fit ?? "",
    neck: d.neck ?? "",
    sleeves: d.sleeves ?? "",
    frontPrint: d.frontPrint ?? "",
    backPrint: d.backPrint ?? "",
    keyFeatures: (d.keyFeatures ?? []).join("\n"),
    washCare: (d.washCare ?? []).join("\n"),
  });

  const allSizes = Array.from(
    new Set([...DEFAULT_SIZES, ...product.variants.map((v) => v.size)]),
  );
  const [sizes, setSizes] = useState<SizeRow[]>(
    allSizes.map((size) => {
      const v = product.variants.find((x) => x.size === size);
      return { size, enabled: Boolean(v), stock: v?.stockQty ?? 0 };
    }),
  );

  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [newImages, setNewImages] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upd =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }));

  function toggleRemove(id: string) {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const chosen = sizes.filter((s) => s.enabled);
    if (chosen.length < 1) {
      setError("Select at least one size.");
      return;
    }
    const files = newImages.filter((x): x is File => Boolean(x));
    const remainingImages =
      product.images.length - removed.size + files.length;
    if (remainingImages < 1) {
      setError("Keep at least one image.");
      return;
    }

    setBusy(true);
    try {
      let newImageKeys: string[] = [];
      if (files.length > 0) {
        const presigns = await presignImages({
          productSlug: product.slug,
          files: files.map((file) => ({
            ext: file.name.split(".").pop() || "jpg",
            contentType: file.type,
          })),
        });
        await Promise.all(
          files.map((file, i) =>
            fetch(presigns[i].url, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            }).then((r) => {
              if (!r.ok) throw new Error(`Image ${i + 1} failed to upload`);
            }),
          ),
        );
        newImageKeys = presigns.map((p) => p.key);
      }

      const res = await updateProduct({
        id: product.id,
        name: f.name,
        color: f.color,
        category: f.category,
        description: f.description,
        priceRupees: f.price,
        sizes: chosen.map((s) => ({ size: s.size, stock: s.stock })),
        removeImageIds: [...removed],
        newImageKeys,
        details: {
          fabric: f.fabric,
          gsm: f.gsm,
          fit: f.fit,
          neck: f.neck,
          sleeves: f.sleeves,
          frontPrint: f.frontPrint,
          backPrint: f.backPrint,
          keyFeatures: f.keyFeatures
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
          washCare: f.washCare
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
        },
      });

      router.push(`/products/${res.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-10">
      {/* Basics */}
      <section className="space-y-5">
        <h2 className={LABEL}>Basics</h2>
        <Field label="Name">
          <input className={INPUT} value={f.name} onChange={upd("name")} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Color">
            <input className={INPUT} value={f.color} onChange={upd("color")} required />
          </Field>
          <Field label="Category">
            <input className={INPUT} value={f.category} onChange={upd("category")} required />
          </Field>
          <Field label="Price (₹)">
            <input className={INPUT} type="number" min="1" value={f.price} onChange={upd("price")} required />
          </Field>
        </div>
        <Field label="Short description">
          <textarea className={cn(INPUT, "min-h-24 resize-y")} value={f.description} onChange={upd("description")} />
        </Field>
      </section>

      {/* Spec */}
      <section className="space-y-5">
        <h2 className={LABEL}>Product details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Fabric"><input className={INPUT} value={f.fabric} onChange={upd("fabric")} /></Field>
          <Field label="GSM"><input className={INPUT} type="number" value={f.gsm} onChange={upd("gsm")} /></Field>
          <Field label="Fit"><input className={INPUT} value={f.fit} onChange={upd("fit")} /></Field>
          <Field label="Neck"><input className={INPUT} value={f.neck} onChange={upd("neck")} /></Field>
          <Field label="Sleeves"><input className={INPUT} value={f.sleeves} onChange={upd("sleeves")} /></Field>
          <Field label="Front print"><input className={INPUT} value={f.frontPrint} onChange={upd("frontPrint")} /></Field>
          <Field label="Back print"><input className={INPUT} value={f.backPrint} onChange={upd("backPrint")} /></Field>
        </div>
        <Field label="Key features (one per line)">
          <textarea className={cn(INPUT, "min-h-32 resize-y")} value={f.keyFeatures} onChange={upd("keyFeatures")} />
        </Field>
        <Field label="Wash care (one per line)">
          <textarea className={cn(INPUT, "min-h-28 resize-y")} value={f.washCare} onChange={upd("washCare")} />
        </Field>
      </section>

      {/* Sizes & stock */}
      <section className="space-y-4">
        <h2 className={LABEL}>Sizes & stock</h2>
        <div className="space-y-3">
          {sizes.map((row, i) => (
            <div key={row.size} className="flex items-center gap-4">
              <label className="flex w-24 items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) =>
                    setSizes((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, enabled: e.target.checked } : r)),
                    )
                  }
                />
                <span className="font-mono text-sm uppercase tracking-[0.1em]">{row.size}</span>
              </label>
              <input
                className={cn(INPUT, "w-28")}
                type="number"
                min="0"
                value={row.stock}
                disabled={!row.enabled}
                onChange={(e) =>
                  setSizes((prev) =>
                    prev.map((r, j) => (j === i ? { ...r, stock: Number(e.target.value) } : r)),
                  )
                }
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">in stock</span>
            </div>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h2 className={LABEL}>Photos</h2>
        {product.images.length > 0 ? (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              Current — click to remove
            </p>
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img) => {
                const isRemoved = removed.has(img.id);
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => toggleRemove(img.id)}
                    className={cn(
                      "relative aspect-[3/4] overflow-hidden border bg-surface",
                      isRemoved ? "border-accent" : "border-border",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl(img.s3Key)}
                      alt=""
                      className={cn(
                        "h-full w-full object-cover",
                        isRemoved && "opacity-30",
                      )}
                    />
                    {isRemoved ? (
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
                        Removed
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Add new
          </p>
          <div className="grid grid-cols-4 gap-3">
            {newImages.map((img, i) => (
              <label
                key={i}
                className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-surface p-2 text-center transition-colors hover:border-foreground"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setNewImages((prev) =>
                      prev.map((p, j) => (j === i ? (e.target.files?.[0] ?? null) : p)),
                    )
                  }
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                  {img ? "Change" : `Add ${i + 1}`}
                </span>
                {img ? (
                  <span className="break-all px-1 font-mono text-[9px] text-foreground/70">
                    {img.name}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </div>
      </section>

      {error ? <p className="font-mono text-xs text-accent">{error}</p> : null}

      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
