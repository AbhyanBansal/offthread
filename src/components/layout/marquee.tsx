const ITEMS = [
  "FREE SHIPPING ABOVE ₹1500",
  "SECURE ONLINE PAYMENTS",
  "7-DAY EXCHANGES",
];

/**
 * Announcement bar with a seamless scroll. Two identical tracks + a -50%
 * translate = an infinite loop with no visible seam.
 */
export function Marquee() {
  const track = [...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="w-full overflow-hidden bg-accent text-accent-foreground">
      <div className="flex w-max animate-marquee py-2">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex items-center"
            aria-hidden={copy === 1 ? true : undefined}
          >
            {track.map((item, i) => (
              <li
                key={`${copy}-${i}`}
                className="flex items-center whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.25em]"
              >
                <span className="px-6">{item}</span>
                <span aria-hidden className="opacity-40">
                  /
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
