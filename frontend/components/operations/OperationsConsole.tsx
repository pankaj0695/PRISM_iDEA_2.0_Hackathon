"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
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
import { OperationSimulator } from "./OperationSimulator";
import type { ActivityLog, Transaction } from "@/lib/db/schemas";
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
  alert: { alert_id: string } | null;
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
  const [simDone, setSimDone] = useState(true);   // false while simulator is running
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Show the simulator whenever it's running (sim not done) OR api still in flight
  const showSim = !simDone || busy;
  // Show confirmation only when both sim AND api are done
  const showResult = simDone && !busy && result !== null;

  function reset() {
    setResult(null);
    setError(null);
    setSimDone(true);
  }

  async function execute() {
    // Reset and start both the simulator and the API call together
    setSimDone(false);
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
        const d = new Date();
        d.setUTCHours(2, 47, 0, 0);
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
      {/* Action selector */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {allActions.map((a) => {
          const I = a.icon;
          const isActive = active.action === a.action;
          return (
            <button
              key={a.action}
              type="button"
              onClick={() => { setActive(a); reset(); }}
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
        {/* Form panel */}
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
                <input className="ub-input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500000" />
              </Field>
            )}
            {active.fields.includes("records") && (
              <Field label={t("operations.fields.recordCount")}>
                <input className="ub-input" type="number" min={0} value={recordCount} onChange={(e) => setRecordCount(e.target.value)} placeholder="847" />
              </Field>
            )}
            {active.fields.includes("accounts") && (
              <Field label={t("operations.fields.accountIds")}>
                <textarea className="ub-input" rows={3} value={accountIds} onChange={(e) => setAccountIds(e.target.value)} placeholder="ACC_00001, ACC_00002, ACC_00003 …" />
              </Field>
            )}
            {active.fields.includes("narration") && (
              <Field label={t("operations.fields.narration")}>
                <input className="ub-input" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder={t("operations.fields.narrationPlaceholder")} />
              </Field>
            )}

            <label className="flex items-center gap-2 rounded-md bg-[var(--ub-blue-50)] px-2.5 py-1.5 text-xs text-[var(--ub-blue)]">
              <input type="checkbox" checked={pretendOffHours} onChange={(e) => setPretendOffHours(e.target.checked)} className="h-3.5 w-3.5" />
              {t("operations.fields.pretendOffHours")}
            </label>

            <Button onClick={execute} disabled={busy || !simDone} size="lg" className="w-full">
              <Zap className="h-4 w-4" />
              {(busy || !simDone) ? t("operations.executing") : t("operations.execute")}
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

        {/* Result / Simulator panel */}
        <Panel title={t("operations.resultTitle")} description={t("operations.resultSubtitle")}>
          {showSim ? (
            <OperationSimulator
              action={active.action}
              account={account}
              amount={amount}
              accountIds={accountIds.split(/[\s,]+/).filter(Boolean)}
              recordCount={recordCount}
              onComplete={() => setSimDone(true)}
            />
          ) : showResult ? (
            <SubmittedCard result={result!} action={active.action} />
          ) : (
            <div className="rounded-md border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--fg-muted)]">
              {t("operations.placeholder")}
            </div>
          )}
        </Panel>
      </div>

      <RecentOps />
    </div>
  );
}

/* ── Submitted confirmation card (no detection scores exposed) ────── */

function SubmittedCard({ result, action }: { result: Result; action: OperationAction }) {
  const t = useTranslations();
  const isFlagged = result.log.status === "FLAGGED";
  return (
    <div className="space-y-4 ub-anim-in">
      {/* Status banner */}
      <div className={`flex items-start gap-4 rounded-lg p-4 ${isFlagged ? "bg-amber-50 ring-1 ring-amber-200" : "bg-emerald-50 ring-1 ring-emerald-200"}`}>
        <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${isFlagged ? "bg-amber-100" : "bg-emerald-100"}`}>
          <CheckCircle2 className={`h-5 w-5 ${isFlagged ? "text-amber-700" : "text-emerald-700"}`} />
        </div>
        <div>
          <div className={`font-semibold ${isFlagged ? "text-amber-800" : "text-emerald-800"}`}>
            {t("operations.submitted")}
          </div>
          <div className={`mt-0.5 text-sm ${isFlagged ? "text-amber-700" : "text-emerald-700"}`}>
            {action.replace(/_/g, " ")} {t("operations.submittedDesc")}
          </div>
        </div>
      </div>

      {/* Minimal log details — no scores */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] divide-y divide-[var(--border)] text-[12.5px]">
        <Row label={t("operations.logId")} value={result.log.log_id} mono />
        <Row label={t("operations.timestamp")} value={format(new Date(result.log.action_datetime), "dd MMM yyyy, HH:mm:ss")} />
        <Row label={t("operations.target")} value={result.log.target_entity_id} mono />
        {result.transaction && (
          <Row label={t("operations.txnId")} value={result.transaction.transaction_id} mono />
        )}
      </div>

      {/* Monitoring notice */}
      <div className="flex items-center gap-2.5 rounded-md border border-[var(--ub-blue-100)] bg-[var(--ub-blue-50)] px-3 py-2.5 text-[12px] text-[var(--ub-blue)]">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>{t("operations.monitoringActive")}</span>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-[var(--fg-muted)]">{label}</span>
      <span className={`text-right text-[var(--fg)] ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

/* ── Recent ops feed ─────────────────────────────────────────────── */

interface MyActivityResp { activity: ActivityLog[] }

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
