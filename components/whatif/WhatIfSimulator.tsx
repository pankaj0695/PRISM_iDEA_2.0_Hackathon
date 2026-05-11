"use client";

import { useState } from "react";
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
      <Panel title="What-If inputs" description="Pose a hypothetical action — no alert is persisted.">
        <div className="space-y-3">
          <Field label="Employee ID">
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="input"
              placeholder="EMP_00007"
            />
          </Field>
          <Field label="Event type">
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="input"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (₹)">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              type="number"
              min={0}
            />
          </Field>
          <Field label="Account ID (optional)">
            <input value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input" />
          </Field>
          <Button onClick={run} disabled={busy}>
            {busy ? "Scoring…" : "Run simulation"}
          </Button>
          {error && <div className="text-sm text-[var(--critical)]">{error}</div>}
        </div>
        <style jsx>{`
          .input {
            width: 100%;
            border: 1px solid var(--border-strong);
            border-radius: 6px;
            padding: 6px 8px;
            font-size: 13px;
            background: white;
          }
          .input:focus {
            outline: none;
            border-color: var(--ub-blue);
          }
        `}</style>
      </Panel>

      <Panel
        title="Simulation result"
        description="Mock detector. Drop in real ML by setting DETECTOR=fastapi in .env."
      >
        {!result ? (
          <div className="rounded-md border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--fg-muted)]">
            Enter inputs and click <strong>Run simulation</strong>.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SeverityBadge severity={result.severity} />
              <span className="text-sm">
                Risk score:{" "}
                <span className="text-base font-semibold tabular-nums">
                  {Math.round(result.risk_score * 100)}
                </span>
                <span className="text-[var(--fg-muted)]">/100</span>
              </span>
              <span className="text-sm text-[var(--fg-muted)]">
                Layer 1 {Math.round(result.layer1.score * 100)} · Layer 2{" "}
                {Math.round(result.layer2.score * 100)}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <BeliefMassBars title="Layer 1 — Graph" masses={result.layer1.belief} />
              <BeliefMassBars title="Layer 2 — Anomaly" masses={result.layer2.belief} />
              <BeliefMassBars title="Fused (Dempster–Shafer)" masses={result.fused_belief} />
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
