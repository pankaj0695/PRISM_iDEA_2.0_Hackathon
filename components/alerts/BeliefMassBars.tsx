import type { BeliefMasses } from "@/lib/db/schemas";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function BeliefMassBars({ title, masses }: { title: string; masses: BeliefMasses }) {
  const segments = [
    { label: "Fraud", value: masses.fraud, color: "var(--critical)" },
    { label: "Uncertain", value: masses.uncertain, color: "var(--watch)" },
    { label: "Legitimate", value: masses.legitimate, color: "var(--clear)" },
  ];
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">{title}</div>
        <div className="text-[11px] text-[var(--fg-muted)]">m(Fraud + Legit + Uncertain) = 1</div>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${Math.max(0, s.value * 100)}%`, background: s.color }}
            title={`${s.label}: ${pct(s.value)}`}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
            <span className="font-medium text-[var(--fg)]">{s.label}</span>
            <span className="ml-auto tabular-nums text-[var(--fg-muted)]">{pct(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
