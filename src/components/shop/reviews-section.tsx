import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProductReviews } from "@/lib/db/queries";
import { imageUrl } from "@/lib/cdn";
import { ReviewStars } from "@/components/shop/review-stars";
import { ReviewForm } from "@/components/shop/review-form";

export async function ReviewsSection({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const [session, data] = await Promise.all([
    auth(),
    getProductReviews(productId),
  ]);
  const loggedIn = Boolean(session?.user);

  return (
    <section className="mt-16 border-t border-border pt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl uppercase leading-none">Reviews</h2>
        {data.count > 0 ? (
          <div className="flex items-center gap-3">
            <ReviewStars rating={data.avg} />
            <span className="font-mono text-xs text-muted">
              {data.avg.toFixed(1)} · {data.count}{" "}
              {data.count === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-8 max-w-xl">
        {loggedIn ? (
          <ReviewForm productId={productId} slug={slug} />
        ) : (
          <p className="font-mono text-xs text-muted">
            <Link
              href="/account"
              className="text-accent underline underline-offset-4"
            >
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        )}
      </div>

      {data.reviews.length > 0 ? (
        <ul className="mt-12 space-y-8">
          {data.reviews.map((r) => (
            <li key={r.id} className="border-t border-border/60 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <ReviewStars rating={r.rating} />
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                    {r.user?.name ?? "Customer"}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {r.body ? (
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                  {r.body}
                </p>
              ) : null}
              {r.photos && r.photos.length > 0 ? (
                <div className="mt-3 flex gap-2">
                  {r.photos.map((key, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={imageUrl(key)}
                      alt=""
                      className="h-20 w-20 border border-border object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          No reviews yet — be the first.
        </p>
      )}
    </section>
  );
}
