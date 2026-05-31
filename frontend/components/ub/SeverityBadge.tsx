"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { Severity } from "@/lib/db/schemas";

const styles: Record<Severity, string> = {
  CRITICAL: "bg-[var(--sev-critical-50)] text-[var(--sev-critical)] ring-1 ring-[var(--sev-critical)]/30",
  HIGH: "bg-[var(--sev-high-50)] text-[var(--sev-high)] ring-1 ring-[var(--sev-high)]/30",
  WATCH: "bg-[var(--sev-watch-50)] text-[var(--sev-watch)] ring-1 ring-[var(--sev-watch)]/30",
  CLEAR: "bg-[var(--sev-clear-50)] text-[var(--sev-clear)] ring-1 ring-[var(--sev-clear)]/30",
};

const dot: Record<Severity, string> = {
  CRITICAL: "bg-[var(--sev-critical)]",
  HIGH: "bg-[var(--sev-high)]",
  WATCH: "bg-[var(--sev-watch)]",
  CLEAR: "bg-[var(--sev-clear)]",
};

export function SeverityBadge({
  severity,
  className,
  pulse,
}: {
  severity: Severity;
  className?: string;
  pulse?: boolean;
}) {
  const t = useTranslations("severity");
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        styles[severity],
        className,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", dot[severity], pulse && "ub-pulse")} />
      {t(severity)}
    </span>
  );
}
