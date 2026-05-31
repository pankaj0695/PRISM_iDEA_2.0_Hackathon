"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Database,
  Eye,
  KeyRound,
  Layers,
  ShieldCheck,
  Sparkles,
  Unlock,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ub/Button";
import { Panel } from "@/components/ub/Panel";
import { SeverityBadge } from "@/components/ub/SeverityBadge";
import { BeliefMassBars } from "@/components/alerts/BeliefMassBars";
import { CausalChain } from "@/components/alerts/CausalChain";
import type { Alert, ActivityLog, Transaction } from "@/lib/db/schemas";
import type { OperationAction } from "@/lib/operations/types";

type Result = {
  ok: boolean;
  classification: {
    suspicious: boolean;
    suspicion_type: string | null;
    reasons: string[];
    emits_transaction: boolean;
  };
  log: ActivityLog;
  transaction: Transaction | null;
  alert: Alert | null;
};

interface ActionCfg {
  action: OperationAction;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "red" | "yellow" | "green";
  fields: ("account" | "customer" | "amount" | "narration" | "records" | "accounts")[];
}

const EMPLOYEE_ACTIONS: ActionCfg[] = [
  { action: "TRANSACTION_INITIATE", icon: CreditCard, tone: "blue", fields: ["account", "amount", "narration"] },
  { action: "ACCOUNT_VIEW", icon: Eye, tone: "blue", fields: ["account"] },
  { action: "BULK_ACCOUNT_ACCESS", icon: Layers, tone: "yellow", fields: ["accounts"] },
  { action: "BULK_DATA_EXPORT", icon: Database, tone: "yellow", fields: ["records"] },
];

const MANAGER_EXTRA_ACTIONS: ActionCfg[] = [
  { action: "FD_BREAK", icon: Unlock, tone: "red", fields: ["account", "amount", "narration"] },
  { action: "OVERRIDE_LIMIT", icon: KeyRound, tone: "red", fields: ["amount", "narration"] },
  { action: "CONFIG_CHANGE", icon: Wrench, tone: "red", fields: ["narration"] },
];

const TONE_BG: Record<ActionCfg["tone"], string> = {
  blue: "bg-[var(--ub-blue-50)] text-[var(--ub-blue)] ring-[var(--ub-blue-100)]",
  red: "bg-[var(--ub-red-50)] text-[var(--ub-red-dark)] ring-[var(--ub-red-100)]",
  yellow: "bg-amber-50 text-amber-700 ring-amber-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export function OperationsConsole({ scope }: { scope: "EMPLOYEE" | "MANAGER" }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const allActions = scope === "MANAGER" ? [...EMPLOYEE_ACTIONS, ...MANAGER_EXTRA_ACTIONS] : EMPLOYEE_ACTIONS;
  const [active, setActive] = useState<ActionCfg>(allActions[0]);

  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [recordCount, setRecordCount] = useState("");
  const [accountIds, setAccountIds] = useState("");
  const [pretendOffHours, setPretendOffHours] = useState(false);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setResult(null);
    setError(null);
  }

  async function execute() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, unknown> = { action: active.action };
      if (active.fields.includes("account") && account) body.account_id = account.trim();
      if (active.fields.includes("amount") && amount) body.amount_inr = Number(amount);
      if (active.fields.includes("narration") && narration) body.narration = narration;
      if (active.fields.includes("records") && recordCount) body.record_count = Number(recordCount);
      if (active.fields.includes("accounts") && accountIds)
        body.account_ids = accountIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      if (pretendOffHours) {
        // 02:47 AM today — same trick used in the doc's classic example.
        const d = new Date();
        d.setHours(2, 47, 0, 0);
        body.pretend_now = d.toISOString();
      }

      const r = await fetch("/api/operations", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setResult(data as Result);
      queryClient.invalidateQueries({ queryKey: ["my-recent-ops"] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {allActions.map((a) => {
          const I = a.icon;
          const isActive = active.action === a.action;
          return (
            <button
              key={a.action}
              type="button"
              onClick={() => {
                setActive(a);
                reset();
              }}
              className={`group ub-card relative overflow-hidden p-3 text-left transition hover:shadow-[var(--shadow-pop)] ${
                isActive ? "ring-2 ring-[var(--ub-blue)]" : ""
              }`}
            >
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ${TONE_BG[a.tone]}`}>
                <I className="h-4.5 w-4.5" />
              </div>
              <div className="text-sm font-semibold text-[var(--fg)]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(t as any)(`operations.action.${a.action}.label`)}
              </div>
              <div className="mt-0.5 text-xs text-[var(--fg-muted)]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(t as any)(`operations.action.${a.action}.hint`)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Panel
          eyebrow={t("operations.formEyebrow")}
          title={/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            (t as any)(`operations.action.${active.action}.label`)}
          description={/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            (t as any)(`operations.action.${active.action}.hint`)}
        >
          <div className="space-y-3">
            {active.fields.includes("account") && (
              <Field label={t("operations.fields.accountId")}>
                <input className="ub-input" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="ACC_00471" />
              </Field>
            )}
            {active.fields.includes("amount") && (
              <Field label={t("operations.fields.amount")}>
                <input
                  className="ub-input"
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500000"
                />
              </Field>
            )}
            {active.fields.includes("records") && (
              <Field label={t("operations.fields.recordCount")}>
                <input
                  className="ub-input"
                  type="number"
                  min={0}
                  value={recordCount}
                  onChange={(e) => setRecordCount(e.target.value)}
                  placeholder="847"
                />
              </Field>
            )}
            {active.fields.includes("accounts") && (
              <Field label={t("operations.fields.accountIds")}>
                <textarea
                  className="ub-input"
                  rows={3}
                  value={accountIds}
                  onChange={(e) => setAccountIds(e.target.value)}
                  placeholder="ACC_00001, ACC_00002, ACC_00003 …"
                />
              </Field>
            )}
            {active.fields.includes("narration") && (
              <Field label={t("operations.fields.narration")}>
                <input
                  className="ub-input"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder={t("operations.fields.narrationPlaceholder")}
                />
              </Field>
            )}

            <label className="flex items-center gap-2 rounded-md bg-[var(--ub-blue-50)] px-2.5 py-1.5 text-xs text-[var(--ub-blue)]">
              <input
                type="checkbox"
                checked={pretendOffHours}
                onChange={(e) => setPretendOffHours(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              {t("operations.fields.pretendOffHours")}
            </label>

            <Button onClick={execute} disabled={busy} size="lg" className="w-full">
              <Zap className="h-4 w-4" />
              {busy ? t("operations.executing") : t("operations.execute")}
            </Button>
            {error && (
              <div className="rounded-md border border-[var(--ub-red)] bg-[var(--ub-red-50)] px-3 py-2 text-sm text-[var(--ub-red-dark)]">
                {error}
              </div>
            )}
          </div>
          <style jsx>{`
            .ub-input {
              width: 100%;
              border: 1px solid var(--border-strong);
              border-radius: 6px;
              padding: 8px 10px;
              font-size: 13px;
              background: white;
              transition: border-color 0.15s, box-shadow 0.15s;
            }
            .ub-input:focus {
              outline: none;
              border-color: var(--ub-blue);
              box-shadow: 0 0 0 2px var(--ring);
            }
          `}</style>
        </Panel>

        <Panel title={t("operations.resultTitle")} description={t("operations.resultSubtitle")}>
          {!result ? (
            <div className="rounded-md border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--fg-muted)]">
              {t("operations.placeholder")}
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`flex flex-wrap items-center gap-3 rounded-md p-3 ${
                  result.classification.suspicious
                    ? "bg-[var(--ub-red-50)]"
                    : "bg-emerald-50"
                }`}
              >
                {result.classification.suspicious ? (
                  <AlertTriangle className="h-5 w-5 text-[var(--ub-red)]" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                )}
                <div className="flex-1 text-sm font-semibold text-[var(--fg)]">
                  {result.classification.suspicious
                    ? t("operations.flagged")
                    : t("operations.clean")}
                </div>
                {result.alert && (
                  <SeverityBadge severity={result.alert.severity} pulse={result.alert.severity === "CRITICAL"} />
                )}
              </div>

              {result.classification.reasons.length > 0 && (
                <ul className="space-y-1 rounded-md border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-[12.5px] text-[var(--fg)]">
                  {result.classification.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ub-blue)]" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}

              {result.alert && (
                <>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span>
                      {t("alert.riskScore")}:{" "}
                      <span className="font-bold tabular-nums text-[var(--sev-critical)]">
                        {Math.round(result.alert.risk_score * 100)}
                      </span>
                    </span>
                    <span className="text-[var(--fg-muted)]">
                      L1 {Math.round(result.alert.layer1.score * 100)} · L2{" "}
                      {Math.round(result.alert.layer2.score * 100)}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <BeliefMassBars title={t("alert.beliefLayer1")} masses={result.alert.layer1.belief} />
                    <BeliefMassBars title={t("alert.beliefLayer2")} masses={result.alert.layer2.belief} />
                    <BeliefMassBars title={t("alert.beliefFused")} masses={result.alert.fused_belief} />
                  </div>
                  <CausalChain steps={result.alert.causal_chain} chainProbability={result.alert.chain_probability} />
                </>
              )}

              <details className="rounded-md border border-[var(--border)] p-3 text-xs">
                <summary className="cursor-pointer font-semibold text-[var(--fg-muted)]">
                  {t("operations.rawRecords")}
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                      Activity log
                    </div>
                    <code className="block whitespace-pre-wrap break-all rounded bg-[var(--bg-soft)] p-2 text-[11px]">
                      {JSON.stringify(result.log, null, 2)}
                    </code>
                  </div>
                  {result.transaction && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                        Transaction
                      </div>
                      <code className="block whitespace-pre-wrap break-all rounded bg-[var(--bg-soft)] p-2 text-[11px]">
                        {JSON.stringify(result.transaction, null, 2)}
                      </code>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </Panel>
      </div>

      <RecentOps />
    </div>
  );
}

interface MyActivityResp {
  activity: ActivityLog[];
}

function RecentOps() {
  const t = useTranslations();
  const { data } = useQuery<MyActivityResp>({
    queryKey: ["my-recent-ops"],
    queryFn: async () => {
      const r = await fetch("/api/me/activity?limit=10", { credentials: "include" });
      return r.json();
    },
    refetchInterval: 5_000,
  });

  const rows = data?.activity || [];
  if (rows.length === 0) return null;

  return (
    <Panel title={t("operations.recentTitle")} description={t("operations.recentSubtitle")}>
      <ol className="divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.log_id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
            <span className="font-mono text-[11px] text-[var(--fg-muted)]">
              {format(new Date(r.action_datetime), "HH:mm:ss")}
            </span>
            <span className="font-semibold text-[var(--fg)]">{r.action_type.replace(/_/g, " ")}</span>
            <span className="text-xs text-[var(--fg-muted)]">→ {r.target_entity_id}</span>
            <span className="ml-auto">
              {r.is_suspicious ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ub-red-50)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ub-red-dark)]">
                  <Sparkles className="h-3 w-3" />
                  {r.suspicion_type?.replace(/_/g, " ")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  OK
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
