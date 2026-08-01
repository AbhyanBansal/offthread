export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
        Our story
      </p>
      <h1 className="mt-3 font-display text-[13vw] uppercase leading-[0.9] tracking-tight sm:text-6xl">
        Built out of
        <br />
        Delhi<span className="text-accent">.</span>
      </h1>

      <div className="mt-10 space-y-5 text-sm leading-relaxed text-muted sm:text-base">
        <p>
          [Placeholder] OFFTHREAD is a streetwear label making heavyweight,
          unisex staples designed to be worn until they fall apart. Add your
          real brand story here.
        </p>
        <p>
          [Placeholder] Talk about the why — the standards, the fabrics, the
          people. This copy is a placeholder you can replace any time.
        </p>
      </div>

      <div className="mt-14 grid gap-10 border-t border-border pt-10 sm:grid-cols-2">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Founder
          </h2>
          <p className="mt-3 font-display text-2xl uppercase leading-none">
            Devraj Singh
          </p>
        </div>
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Built &amp; engineered
          </h2>
          <p className="mt-3 font-display text-2xl uppercase leading-none">
            Abhyan Bansal
          </p>
        </div>
      </div>
    </div>
  );
}
