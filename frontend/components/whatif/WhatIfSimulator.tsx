"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ub/Button";
import { Panel } from "@/components/ub/Panel";
import { SeverityBadge } from "@/components/ub/SeverityBadge";
import { BeliefMassBars } from "@/components/alerts/BeliefMassBars";
import { CausalChain } from "@/components/alerts/CausalChain";
import type { DetectionResult } from "@/lib/detect/types";

const EVENT_TYPES = [
  "OFF_HOURS_HIGH_VALUE",
  "DORMANT_ACCOUNT_ACTIVITY",
  "FD_PREMATURE_BREAK",
  "APPROVAL_LIMIT_BREACH",
  "COLLUSION_COORDINATED_ACCESS",
  "BULK_DATA_EXPORT",
  "OFF_HOURS_LOGIN",
  "UNKNOWN_DEVICE_IP",
  "BULK_ACCOUNT_ACCESS",
  "REPEATED_FAILED_LOGIN",
  "PRIVILEGE_ESCALATION_ATTEMPT",
  "CROSS_BRANCH_ACCESS",
];

export function WhatIfSimulator() {
  const t = useTranslations();
  const [employeeId, setEmployeeId] = useState("EMP_00007");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [amount, setAmount] = useState("500000");
  const [accountId, setAccountId] = useState("ACC_00471");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/detect/whatif", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          event_type: eventType,
          event_metadata: {
            amount_inr: Number(amount) || undefined,
            account_id: accountId || undefined,
          },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setResult(d.result as DetectionResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <Panel title={t("whatIf.inputsTitle")} description={t("whatIf.inputsSubtitle")}>
        <div className="space-y-3">
          <Field label={t("whatIf.employeeId")}>
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="ub-input"
              placeholder="EMP_00007"
            />
          </Field>
          <Field label={t("whatIf.eventType")}>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="ub-input"
            >
              {EVENT_TYPES.map((et) => (
                <option key={et} value={et}>
                  {et.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("whatIf.amount")}>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="ub-input"
              type="number"
              min={0}
            />
          </Field>
          <Field label={t("whatIf.accountId")}>
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="ub-input"
            />
          </Field>
          <Button onClick={run} disabled={busy} size="lg">
            <Sparkles className="h-4 w-4" /> {busy ? t("whatIf.running") : t("whatIf.run")}
          </Button>
          {error && <div className="text-sm text-[var(--sev-critical)]">{error}</div>}
        </div>
        <style jsx>{`
          .ub-input {
            width: 100%;
            border: 1px solid var(--border-strong);
            border-radius: 6px;
            padding: 7px 9px;
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

      <Panel title={t("whatIf.resultTitle")} description={t("whatIf.resultSubtitle")}>
        {!result ? (
          <div className="rounded-md border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--fg-muted)]">
            {t("whatIf.placeholder")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SeverityBadge severity={result.severity} pulse={result.severity === "CRITICAL"} />
              <span className="text-sm">
                {t("alert.riskScore")}:{" "}
                <span className="text-base font-bold tabular-nums">
                  {Math.round(result.risk_score * 100)}
                </span>
                <span className="text-[var(--fg-muted)]">/100</span>
              </span>
              <span className="text-sm text-[var(--fg-muted)]">
                L1 {Math.round(result.layer1.score * 100)} · L2{" "}
                {Math.round(result.layer2.score * 100)}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <BeliefMassBars title={t("alert.beliefLayer1")} masses={result.layer1.belief} />
              <BeliefMassBars title={t("alert.beliefLayer2")} masses={result.layer2.belief} />
              <BeliefMassBars title={t("alert.beliefFused")} masses={result.fused_belief} />
            </div>
            <CausalChain steps={result.causal_chain} chainProbability={result.chain_probability} />
          </div>
        )}
      </Panel>
    </div>
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
