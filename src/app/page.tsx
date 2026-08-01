import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { bounceAdminToDashboard } from "@/lib/guard";

const ETHOS = [
  {
    k: "01",
    t: "Heavyweight cotton",
    d: "Premium 240 GSM. Soft, breathable, built to outlast trends.",
  },
  {
    k: "02",
    t: "Original graphics",
    d: "Prints designed in-house — front and back. No filler.",
  },
  {
    k: "03",
    t: "Limited drops",
    d: "Small runs, no restocks. When it's gone, it's gone.",
  },
];

export default async function Home() {
  await bounceAdminToDashboard();

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-[calc(100vh-8rem)] flex-col justify-center py-20">
            <div className="inline-flex w-fit items-center gap-2 border border-border px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                Cut 01 — Now shipping
              </span>
            </div>

            <h1 className="mt-8 font-display text-[15vw] uppercase leading-[0.85] tracking-tight sm:text-[13vw] lg:text-[9.5rem]">
              Cut for
              <br />
              the street<span className="text-accent">.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Heavyweight cotton tees, cut oversized and printed with graphics
              you won&apos;t see on everyone else. Made in Delhi, dropped in
              limited numbers — once a design&apos;s gone, it&apos;s gone.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Shop the drop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Our story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
          {ETHOS.map((f) => (
            <div key={f.k} className="py-10 sm:px-8 sm:first:pl-0">
              <span className="font-mono text-xs text-accent">{f.k}</span>
              <h3 className="mt-3 font-mono text-sm uppercase tracking-[0.15em]">
                {f.t}
              </h3>
              <p className="mt-2 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
