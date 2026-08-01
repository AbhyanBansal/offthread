// Shared oversized-tee size chart (same for every listing). Inches.
const ROWS = [
  { size: "M", length: 29, chest: 44, sleeve: 9.5, shoulder: 21 },
  { size: "L", length: 29.5, chest: 46, sleeve: 10, shoulder: 21.5 },
  { size: "XL", length: 30, chest: 48, sleeve: 10.5, shoulder: 23 },
];

export function SizeChart() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-[0.15em] text-muted">
              <th className="py-2 pr-3">Size</th>
              <th className="py-2 pr-3">Length</th>
              <th className="py-2 pr-3">Chest</th>
              <th className="py-2 pr-3">Sleeve</th>
              <th className="py-2">Shoulder</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.size} className="border-b border-border/50">
                <td className="py-2 pr-3 uppercase">{r.size}</td>
                <td className="py-2 pr-3">{`${r.length}"`}</td>
                <td className="py-2 pr-3">{`${r.chest}"`}</td>
                <td className="py-2 pr-3">{`${r.sleeve}"`}</td>
                <td className="py-2">{`${r.shoulder}"`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
        Measurements in inches · Oversized fit
      </p>
    </div>
  );
}
