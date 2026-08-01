"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, presignImages } from "@/server/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_SIZES = ["M", "L", "XL"];

const DEFAULT_FEATURES = [
  "Premium 240 GSM French Terry Cotton",
  "Oversized fit for a modern streetwear look",
  "Soft, breathable, and lightweight fabric",
  "Comfortable to wear all day",
  "High-quality, long-lasting graphic print",
  "Durable stitching with a premium finish",
].join("\n");

const DEFAULT_WASH = [
  "Machine wash cold",
  "Wash inside out",
  "Do not bleach",
  "Dry in shade",
  "Do not iron directly on the print",
].join("\n");

const INPUT =
  "w-full border border-border bg-surface px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none";
const LABEL =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-muted";

type SizeRow = { size: string; enabled: boolean; stock: number };

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

export function ProductForm() {
  const router = useRouter();
  const [f, setF] = useState({
    name: "",
    color: "",
    category: "Oversized T-Shirts",
    price: "",
    description: "",
    fabric: "100% Premium French Terry Cotton",
    gsm: "240",
    fit: "Oversized Fit",
    neck: "Round Neck",
    sleeves: "Half Sleeves",
    frontPrint: "OFFTHREAD Logo Print",
    backPrint: "",
    keyFeatures: DEFAULT_FEATURES,
    washCare: DEFAULT_WASH,
  });
  const [sizes, setSizes] = useState<SizeRow[]>(
    DEFAULT_SIZES.map((s) => ({ size: s, enabled: true, stock: 10 })),
  );
  const [images, setImages] = useState<(File | null)[]>([
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const files = images.filter((x): x is File => Boolean(x));
    if (files.length < 1) {
      setError("Add at least one image (4 recommended).");
      return;
    }
    const chosen = sizes.filter((s) => s.enabled);
    if (chosen.length < 1) {
      setError("Select at least one size.");
      return;
    }

    setBusy(true);
    try {
      const presigns = await presignImages({
        productSlug: `${f.name}-${f.color}`,
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

      const res = await createProduct({
        name: f.name,
        color: f.color,
        category: f.category,
        description: f.description,
        priceRupees: f.price,
        sizes: chosen.map((s) => ({ size: s.size, stock: s.stock })),
        imageKeys: presigns.map((p) => p.key),
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
          <input
            className={INPUT}
            placeholder="Panda Oversized T-Shirt (White)"
            value={f.name}
            onChange={upd("name")}
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Color">
            <input
              className={INPUT}
              placeholder="White"
              value={f.color}
              onChange={upd("color")}
              required
            />
          </Field>
          <Field label="Category">
            <input
              className={INPUT}
              value={f.category}
              onChange={upd("category")}
              required
            />
          </Field>
          <Field label="Price (₹)">
            <input
              className={INPUT}
              type="number"
              min="1"
              placeholder="1499"
              value={f.price}
              onChange={upd("price")}
              required
            />
          </Field>
        </div>
        <Field label="Short description">
          <textarea
            className={cn(INPUT, "min-h-24 resize-y")}
            placeholder="Experience premium comfort with the OFFTHREAD…"
            value={f.description}
            onChange={upd("description")}
          />
        </Field>
      </section>

      {/* Spec */}
      <section className="space-y-5">
        <h2 className={LABEL}>Product details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Fabric">
            <input className={INPUT} value={f.fabric} onChange={upd("fabric")} />
          </Field>
          <Field label="GSM">
            <input
              className={INPUT}
              type="number"
              value={f.gsm}
              onChange={upd("gsm")}
            />
          </Field>
          <Field label="Fit">
            <input className={INPUT} value={f.fit} onChange={upd("fit")} />
          </Field>
          <Field label="Neck">
            <input className={INPUT} value={f.neck} onChange={upd("neck")} />
          </Field>
          <Field label="Sleeves">
            <input
              className={INPUT}
              value={f.sleeves}
              onChange={upd("sleeves")}
            />
          </Field>
          <Field label="Front print">
            <input
              className={INPUT}
              value={f.frontPrint}
              onChange={upd("frontPrint")}
            />
          </Field>
          <Field label="Back print">
            <input
              className={INPUT}
              placeholder="Panda Graphic Print"
              value={f.backPrint}
              onChange={upd("backPrint")}
            />
          </Field>
        </div>
        <Field label="Key features (one per line)">
          <textarea
            className={cn(INPUT, "min-h-32 resize-y")}
            value={f.keyFeatures}
            onChange={upd("keyFeatures")}
          />
        </Field>
        <Field label="Wash care (one per line)">
          <textarea
            className={cn(INPUT, "min-h-28 resize-y")}
            value={f.washCare}
            onChange={upd("washCare")}
          />
        </Field>
      </section>

      {/* Sizes */}
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
                      prev.map((r, j) =>
                        j === i ? { ...r, enabled: e.target.checked } : r,
                      ),
                    )
                  }
                />
                <span className="font-mono text-sm uppercase tracking-[0.1em]">
                  {row.size}
                </span>
              </label>
              <input
                className={cn(INPUT, "w-28")}
                type="number"
                min="0"
                value={row.stock}
                disabled={!row.enabled}
                onChange={(e) =>
                  setSizes((prev) =>
                    prev.map((r, j) =>
                      j === i ? { ...r, stock: Number(e.target.value) } : r,
                    ),
                  )
                }
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                in stock
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h2 className={LABEL}>Images (up to 4 — first is the cover)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((img, i) => (
            <label
              key={i}
              className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-surface p-2 text-center transition-colors hover:border-foreground"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setImages((prev) =>
                    prev.map((p, j) =>
                      j === i ? (e.target.files?.[0] ?? null) : p,
                    ),
                  )
                }
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                {img ? "Change" : `Image ${i + 1}`}
              </span>
              {img ? (
                <span className="break-all px-1 font-mono text-[9px] text-foreground/70">
                  {img.name}
                </span>
              ) : null}
            </label>
          ))}
        </div>
      </section>

      {error ? (
        <p className="font-mono text-xs text-accent">{error}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Publishing…" : "Publish listing"}
      </Button>
    </form>
  );
}
