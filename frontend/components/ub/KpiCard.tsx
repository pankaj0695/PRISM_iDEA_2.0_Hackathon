import clsx from "clsx";
import type { ReactNode } from "react";

type Accent = "blue" | "red" | "yellow" | "green";

const ACCENT_BAR: Record<Accent, string> = {
  blue: "bg-[var(--ub-blue)]",
  red: "bg-[var(--ub-red)]",
  yellow: "bg-[var(--ub-yellow)]",
  green: "bg-[var(--sev-clear)]",
};

const ACCENT_TINT: Record<Accent, string> = {
  blue: "from-[var(--ub-blue-50)]/70 to-transparent",
  red: "from-[var(--ub-red-50)]/80 to-transparent",
  yellow: "from-amber-50 to-transparent",
  green: "from-emerald-50 to-transparent",
};

const ACCENT_RING: Record<Accent, string> = {
  blue: "shadow-[inset_0_-2px_0_var(--ub-blue-100)]",
  red: "shadow-[inset_0_-2px_0_var(--ub-red-100)]",
  yellow: "shadow-[inset_0_-2px_0_#fde68a]",
  green: "shadow-[inset_0_-2px_0_#bbf7d0]",
};

const ACCENT_ICON: Record<Accent, string> = {
  blue: "bg-[var(--ub-blue-100)] text-[var(--ub-blue)]",
  red: "bg-[var(--ub-red-100)] text-[var(--ub-red-dark)]",
  yellow: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
};

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
  accent?: Accent;
  trendLabel?: string;
}) {
  return (
    <div
      className={clsx(
        "ub-card relative overflow-hidden transition hover:translate-y-[-1px] hover:shadow-[var(--shadow-pop)]",
        ACCENT_RING[accent],
      )}
    >
      <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-90", ACCENT_TINT[accent])} />
      <div className={clsx("absolute left-0 top-0 h-full w-1.5", ACCENT_BAR[accent])} />
      <div className="relative p-4 pl-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            {label}
          </div>
          {icon ? (
            <div className={clsx("grid h-7 w-7 place-items-center rounded-md", ACCENT_ICON[accent])}>
              {icon}
            </div>
          ) : null}
        </div>
        <div className="mt-1 text-[26px] font-bold tabular-nums leading-tight text-[var(--fg)]">
          {value}
        </div>
        {hint && <div className="mt-0.5 text-xs text-[var(--fg-muted)]">{hint}</div>}
        {trendLabel && (
          <div className="mt-1 text-[11px] font-medium text-[var(--ub-blue)]">{trendLabel}</div>
        )}
      </div>
    </div>
  );
}
