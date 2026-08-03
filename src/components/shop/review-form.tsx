"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { presignReviewImages, submitReview } from "@/server/reviews";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_WORDS = 50;

export function ReviewForm({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<(File | null)[]>([null, null]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const over = words > MAX_WORDS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Pick a star rating.");
      return;
    }
    if (over) {
      setError(`Keep it under ${MAX_WORDS} words.`);
      return;
    }

    setBusy(true);
    try {
      const files = photos.filter((x): x is File => Boolean(x));
      let photoKeys: string[] = [];
      if (files.length > 0) {
        const presigns = await presignReviewImages({
          productId,
          files: files.map((f) => ({
            ext: f.name.split(".").pop() || "jpg",
            contentType: f.type,
          })),
        });
        await Promise.all(
          files.map((f, i) =>
            fetch(presigns[i].url, {
              method: "PUT",
              headers: { "Content-Type": f.type },
              body: f,
            }).then((r) => {
              if (!r.ok) throw new Error(`Photo ${i + 1} failed to upload`);
            }),
          ),
        );
        photoKeys = presigns.map((p) => p.key);
      }

      await submitReview({ productId, slug, rating, body, photoKeys });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Thanks for your review ✓
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Your rating
        </span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              aria-label={`${i} star${i === 1 ? "" : "s"}`}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  (hover || rating) >= i
                    ? "fill-accent text-accent"
                    : "fill-transparent text-border",
                )}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts (max 50 words)…"
          className="min-h-24 w-full resize-y border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
        />
        <p
          className={cn(
            "mt-1 font-mono text-[10px] uppercase tracking-[0.15em]",
            over ? "text-accent" : "text-muted",
          )}
        >
          {words}/{MAX_WORDS} words
        </p>
      </div>

      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Add up to 2 photos
        </span>
        <div className="mt-2 flex gap-3">
          {photos.map((p, i) => (
            <label
              key={i}
              className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden border border-dashed border-border bg-surface p-1 text-center transition-colors hover:border-foreground"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setPhotos((prev) =>
                    prev.map((x, j) =>
                      j === i ? (e.target.files?.[0] ?? null) : x,
                    ),
                  )
                }
              />
              <span className="break-all font-mono text-[9px] uppercase text-muted">
                {p ? "✓" : "Add"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error ? <p className="font-mono text-xs text-accent">{error}</p> : null}

      <Button type="submit" disabled={busy}>
        {busy ? "Posting…" : "Post review"}
      </Button>
    </form>
  );
}
