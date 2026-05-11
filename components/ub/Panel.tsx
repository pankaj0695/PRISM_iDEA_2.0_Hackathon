import clsx from "clsx";
import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  action,
  eyebrow,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("ub-card overflow-hidden", className)}>
      {(title || action || eyebrow) && (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] bg-gradient-to-b from-white to-[var(--bg-soft)]/40 px-4 py-3">
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ub-blue)]">
                {eyebrow}
              </div>
            )}
            {title && <h2 className="text-sm font-semibold text-[var(--fg)]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={clsx("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
