import clsx from "clsx";
import type { Severity } from "@/lib/db/schemas";

const styles: Record<Severity, string> = {
  CRITICAL: "bg-[var(--critical)] text-white",
  HIGH: "bg-[var(--high)] text-white",
  WATCH: "bg-[var(--watch)] text-white",
  CLEAR: "bg-[var(--clear)] text-white",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        styles[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}
