import clsx from "clsx";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = "blue",
  trendLabel,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "blue" | "red" | "yellow" | "green";
  trendLabel?: string;
}) {
  const accentBar = {
    blue: "bg-[var(--ub-blue)]",
    red: "bg-[var(--ub-red)]",
    yellow: "bg-[var(--ub-yellow)]",
    green: "bg-[var(--clear)]",
  }[accent];
  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className={clsx("absolute left-0 top-0 h-full w-1", accentBar)} />
      <div className="ml-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">{label}</div>
          {icon ? <div className="text-[var(--fg-muted)]">{icon}</div> : null}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--fg)]">{value}</div>
        {hint && <div className="text-xs text-[var(--fg-muted)]">{hint}</div>}
        {trendLabel && <div className="mt-1 text-[11px] font-medium text-[var(--ub-blue)]">{trendLabel}</div>}
      </div>
    </div>
  );
}
