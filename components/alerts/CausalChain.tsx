"use client";

import { useTranslations } from "next-intl";
import type { CausalStep } from "@/lib/db/schemas";

export function CausalChain({
  steps,
  chainProbability,
}: {
  steps: CausalStep[];
  chainProbability: number;
}) {
  const t = useTranslations("alert");

  if (!steps?.length) {
    return (
      <div className="ub-card border-dashed p-4 text-sm text-[var(--fg-muted)]">
        —
      </div>
    );
  }
  return (
    <div className="ub-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--ub-blue-50)] to-transparent px-3 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ub-blue)]">
          {t("causalChain")}
        </h3>
        <div className="text-[11px] text-[var(--fg-muted)]">
          {t("chainProbability")}:{" "}
          <span className="font-semibold tabular-nums text-[var(--sev-critical)]">
            {(chainProbability * 100).toFixed(4)}%
          </span>
        </div>
      </div>
      <ol className="divide-y divide-[var(--border)]">
        {steps.map((s) => (
          <li key={s.order} className="flex gap-3 px-3 py-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--ub-blue)] text-xs font-semibold text-white shadow-sm">
              {s.order}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm leading-6 text-[var(--fg)]">{s.description}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--fg-muted)]">
                <span>
                  feature:{" "}
                  <span className="font-mono text-[var(--fg)]">{s.feature}</span>
                </span>
                <span>
                  SHAP:{" "}
                  <span className="tabular-nums text-[var(--fg)]">{s.contribution.toFixed(3)}</span>
                </span>
                <span>
                  p(step):{" "}
                  <span className="tabular-nums text-[var(--fg)]">{s.probability.toFixed(4)}</span>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
