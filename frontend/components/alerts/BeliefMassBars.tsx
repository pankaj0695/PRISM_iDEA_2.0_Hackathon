"use client";

import { useTranslations } from "next-intl";
import type { BeliefMasses } from "@/lib/db/schemas";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function BeliefMassBars({ title, masses }: { title: string; masses: BeliefMasses }) {
  const t = useTranslations("alert");
  const segments = [
    { key: "fraud" as const, value: masses.fraud, color: "var(--sev-critical)" },
    { key: "uncertain" as const, value: masses.uncertain, color: "var(--sev-watch)" },
    { key: "legitimate" as const, value: masses.legitimate, color: "var(--sev-clear)" },
  ];
  return (
    <div className="ub-card p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          {title}
        </div>
        <div className="text-[10px] text-[var(--fg-muted)]">{t("beliefSum")}</div>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--bg-muted)] ring-1 ring-inset ring-black/5">
        {segments.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${Math.max(0, s.value * 100)}%`,
              background: `linear-gradient(180deg, ${s.color} 0%, color-mix(in oklab, ${s.color} 80%, black) 100%)`,
            }}
            title={`${t(s.key)}: ${pct(s.value)}`}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="font-medium text-[var(--fg)]">{t(s.key)}</span>
            <span className="ml-auto tabular-nums text-[var(--fg-muted)]">{pct(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
