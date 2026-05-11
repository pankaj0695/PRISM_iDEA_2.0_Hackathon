import type { CausalStep } from "@/lib/db/schemas";

export function CausalChain({
  steps,
  chainProbability,
}: {
  steps: CausalStep[];
  chainProbability: number;
}) {
  if (!steps?.length) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--fg-muted)]">
        No causal chain available — the model found no anomalous events.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-[var(--border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Causal chain (SHAP-ordered)
        </h3>
        <div className="text-[11px] text-[var(--fg-muted)]">
          Chain probability:{" "}
          <span className="font-semibold tabular-nums text-[var(--critical)]">
            {(chainProbability * 100).toFixed(4)}%
          </span>
        </div>
      </div>
      <ol className="divide-y divide-[var(--border)]">
        {steps.map((s) => (
          <li key={s.order} className="flex gap-3 px-3 py-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--ub-blue)] text-xs font-semibold text-white">
              {s.order}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-[var(--fg)]">{s.description}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--fg-muted)]">
                <span>
                  feature: <span className="font-mono text-[var(--fg)]">{s.feature}</span>
                </span>
                <span>
                  SHAP contribution:{" "}
                  <span className="tabular-nums text-[var(--fg)]">{s.contribution.toFixed(3)}</span>
                </span>
                <span>
                  p(step): <span className="tabular-nums text-[var(--fg)]">{s.probability.toFixed(4)}</span>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
