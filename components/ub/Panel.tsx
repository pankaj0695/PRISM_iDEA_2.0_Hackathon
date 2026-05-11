import clsx from "clsx";
import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-lg border border-[var(--border)] bg-white shadow-sm", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-[var(--fg)]">{title}</h2>}
            {description && <p className="text-xs text-[var(--fg-muted)]">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
