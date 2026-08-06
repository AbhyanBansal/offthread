export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
        Our story
      </p>
      <h1 className="mt-3 font-display text-[13vw] uppercase leading-[0.9] tracking-tight sm:text-6xl">
        Not just
        <br />
        clothing<span className="text-accent">.</span>
      </h1>

      <div className="mt-10 space-y-5 text-sm leading-relaxed text-muted sm:text-base">
        <p className="text-foreground/90">
          OffThread isn’t just clothing. It’s a way of standing out without
          trying too hard.
        </p>
        <p>
          Founded by Devraj, OffThread was created with a simple idea — to make
          streetwear that feels as good as it looks. We focus on clean
          silhouettes, effortless fits, and quality you can actually feel.
        </p>
        <p>
          Our oversized and boxy-fit T-shirts are crafted from premium 240 GSM
          French Terry cotton, giving them a structured, heavyweight feel while
          staying comfortable enough for everyday wear.
        </p>
        <p>
          At OffThread, we believe the details matter — from the fabric we
          choose to the way every piece fits and falls. We don’t believe in
          putting out clothes just for the sake of following trends. We create
          pieces designed to become part of your everyday rotation.
        </p>
      </div>

      <p className="mt-10 font-display text-2xl uppercase leading-tight sm:text-3xl">
        Premium fabric. Relaxed silhouettes.{" "}
        <span className="text-accent">Unapologetic style.</span>
      </p>
      <p className="mt-6 font-mono text-sm uppercase tracking-[0.2em] text-muted">
        This is OffThread.
      </p>
      <p className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-accent">
        Wear different. Stay OffThread.
      </p>

      {/* Contact */}
      <div className="mt-14 border-t border-border pt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Contact
        </h2>
        <div className="mt-4 space-y-2 font-mono text-sm">
          <p>
            <a
              href="tel:+918595687501"
              className="transition-colors hover:text-accent"
            >
              +91 85956 87501
            </a>
          </p>
          <p>
            <a
              href="mailto:offthread026@gmail.com"
              className="transition-colors hover:text-accent"
            >
              offthread026@gmail.com
            </a>
          </p>
          <p>
            <a
              href="https://www.instagram.com/offthread_clothing"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              @offthread_clothing
            </a>
          </p>
        </div>
      </div>

      {/* Credits */}
      <div className="mt-12 grid gap-8 border-t border-border pt-10 sm:grid-cols-2">
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
