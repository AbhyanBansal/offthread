const POINTS = [
  "No returns — every order comes with a 100% guaranteed replacement, no questions asked.",
  "Items must be unworn and unwashed to be eligible for an exchange.",
  "Exchanges are valid up to 7 days from the date of delivery.",
];

export function ReturnPolicy() {
  return (
    <ul className="space-y-2 text-sm text-muted">
      {POINTS.map((p, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-accent">—</span>
          {p}
        </li>
      ))}
    </ul>
  );
}
