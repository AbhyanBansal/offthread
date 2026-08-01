import Link from "next/link";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Shop",
    links: [
      ["Shop all", "/shop"],
      ["New drop", "/shop"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Returns", "/returns"],
      ["Size guide", "/size-guide"],
    ],
  },
  {
    title: "Brand",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-mono text-lg font-bold uppercase tracking-[0.15em]"
            >
              OFFTHREAD<span className="text-accent">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted">
              Heavyweight graphic tees, made in Delhi and dropped in limited
              numbers.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            © {year} OFFTHREAD
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Secure payments · Made in India
          </p>
        </div>
      </div>
    </footer>
  );
}
