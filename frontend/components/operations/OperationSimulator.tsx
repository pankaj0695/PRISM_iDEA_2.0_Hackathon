"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { OperationAction } from "@/lib/operations/types";

const STEPS: Record<OperationAction, string[]> = {
  TRANSACTION_INITIATE: [
    "Authenticating employee identity",
    "Validating account balance & limits",
    "Processing debit instruction",
    "Confirming credit transfer",
  ],
  ACCOUNT_VIEW: [
    "Verifying access clearance",
    "Fetching account records",
    "Decrypting customer PII",
    "Rendering profile data",
  ],
  BULK_ACCOUNT_ACCESS: [
    "Building access manifest",
    "Authenticating batch token",
    "Opening account handles",
    "Logging access trail",
  ],
  BULK_DATA_EXPORT: [
    "Scanning database tables",
    "Serialising record batch",
    "Compressing export payload",
    "Staging download file",
  ],
  FD_BREAK: [
    "Locating FD contract",
    "Computing premature penalty",
    "Processing break request",
    "Crediting net proceeds",
  ],
  OVERRIDE_LIMIT: [
    "Verifying override authority",
    "Checking approval chain",
    "Applying limit override",
    "Recording audit event",
  ],
  CONFIG_CHANGE: [
    "Locking configuration mutex",
    "Validating change schema",
    "Broadcasting to cluster nodes",
    "Persisting audit entry",
  ],
};

/* ── Per-action visualisations ───────────────────────────────────────── */

function TransactionViz({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      {/* Debit node */}
      <div
        className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-500 ${
          step >= 2
            ? "scale-110 border-[var(--ub-red)] bg-[var(--ub-red-50)] text-[var(--ub-red-dark)]"
            : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--fg-muted)]"
        }`}
      >
        <span>DEBIT</span>
        <span className="text-[9px] opacity-70">Source</span>
      </div>

      {/* Flow arrow */}
      <div className="relative flex flex-1 items-center">
        <div
          className={`h-0.5 w-full transition-all duration-700 ${step >= 2 ? "bg-[var(--ub-red)]" : "bg-[var(--border)]"}`}
        />
        {step === 2 && (
          <span
            className="absolute left-1/3 h-3 w-3 rounded-full bg-[var(--ub-red)]"
            style={{ animation: "tx-slide 0.7s ease-in-out infinite" }}
          />
        )}
        {step >= 3 && (
          <span
            className="absolute left-2/3 h-3 w-3 rounded-full bg-emerald-500"
            style={{ animation: "tx-slide 0.7s ease-in-out infinite" }}
          />
        )}
        <svg
          className={`absolute right-0 h-3 w-3 transition-all duration-500 ${step >= 2 ? "text-[var(--ub-red)]" : "text-[var(--border)]"}`}
          viewBox="0 0 10 10"
          fill="currentColor"
        >
          <polygon points="0,2 8,5 0,8" />
        </svg>
      </div>

      {/* Credit node */}
      <div
        className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-500 ${
          step >= 3
            ? "scale-110 border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--fg-muted)]"
        }`}
      >
        <span>CREDIT</span>
        <span className="text-[9px] opacity-70">Target</span>
      </div>
    </div>
  );
}

function AccountViewViz({ step }: { step: number }) {
  const rows = ["Account Number", "Available Balance", "Transaction History", "KYC / AML Status"];
  return (
    <div className="space-y-1.5 py-2">
      {rows.map((label, i) => (
        <div
          key={label}
          style={{ transitionDelay: `${i * 100}ms` }}
          className={`flex items-center justify-between rounded border px-3 py-1.5 transition-all duration-400 ${
            step > i
              ? "border-[var(--ub-blue-100)] bg-[var(--ub-blue-50)]"
              : "border-[var(--border)] bg-[var(--bg-soft)]"
          }`}
        >
          <span
            className={`text-[11px] font-medium ${step > i ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}
          >
            {label}
          </span>
          <span
            className={`font-mono text-[11px] transition-all duration-300 ${
              step > i ? "text-[var(--ub-blue)]" : "text-[var(--fg-muted)]"
            }`}
          >
            {step > i ? (
              <span style={{ animation: "reveal 0.4s ease-out forwards" }}>████████</span>
            ) : (
              "—"
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function BulkAccessViz({ step, count }: { step: number; count: number }) {
  const total = Math.min(Math.max(count, 6), 18);
  const litCount = step === 0 ? 0 : Math.ceil((step / 3) * total);
  return (
    <div className="py-2">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${Math.min(total, 6)}, 1fr)` }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const lit = i < litCount;
          return (
            <div
              key={i}
              style={{ transitionDelay: `${i * 55}ms` }}
              className={`flex h-10 w-full items-center justify-center rounded border text-[9px] font-mono font-semibold transition-all duration-300 ${
                lit
                  ? "border-[var(--ub-blue)] bg-[var(--ub-blue-50)] text-[var(--ub-blue)] shadow-sm"
                  : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--fg-muted)]"
              }`}
            >
              {lit ? "✓" : "ACC"}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center text-[10px] text-[var(--fg-muted)]">
        {litCount} / {total} accounts accessed
      </div>
    </div>
  );
}

function BulkExportViz({ step, total }: { step: number; total: number }) {
  const count = total > 0 ? total : 847;
  const pct = Math.round((step / 3) * 100);
  const displayCount = Math.round((step / 3) * count);
  const tables = ["Accounts", "Txns", "Logs", "Profiles"];
  return (
    <div className="space-y-3 py-2">
      <div className="flex items-end justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Records exported
        </span>
        <span className="font-mono text-sm font-bold tabular-nums text-[var(--fg)]">
          {displayCount.toLocaleString("en-IN")}
          <span className="text-[var(--fg-muted)]"> / {count.toLocaleString("en-IN")}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-soft)] ring-1 ring-inset ring-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--ub-blue), #f59e0b)",
          }}
        />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {tables.map((label, i) => (
          <div
            key={label}
            style={{ transitionDelay: `${i * 130}ms` }}
            className={`rounded border p-1.5 text-center transition-all duration-500 ${
              step > i
                ? "border-[var(--ub-blue-100)] bg-[var(--ub-blue-50)]"
                : "border-[var(--border)] bg-[var(--bg-soft)]"
            }`}
          >
            <div
              className={`text-[9px] font-semibold uppercase tracking-wide ${
                step > i ? "text-[var(--ub-blue)]" : "text-[var(--fg-muted)]"
              }`}
            >
              {label}
            </div>
            <div className={`text-[9px] mt-0.5 ${step > i ? "text-emerald-600" : "text-[var(--fg-muted)]"}`}>
              {step > i ? "done" : "…"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FDBreakViz({ step }: { step: number }) {
  const breakAt = 65;
  return (
    <div className="space-y-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
        FD Maturity Timeline
      </div>
      <div className="relative h-9 overflow-hidden rounded-lg ring-1 ring-[var(--border)]">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: step >= 2 ? `${breakAt}%` : "100%",
            background: "linear-gradient(90deg, #f59e0b, #d97706)",
          }}
        />
        {/* Penalty zone */}
        {step >= 2 && (
          <div
            className="absolute top-0 h-full transition-all duration-500"
            style={{
              left: `${breakAt}%`,
              width: `${100 - breakAt}%`,
              background: "repeating-linear-gradient(45deg, rgba(220,38,38,0.15) 0px, rgba(220,38,38,0.15) 6px, transparent 6px, transparent 12px)",
            }}
          />
        )}
        {/* Cut line */}
        {step >= 2 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-[var(--ub-red)]"
            style={{ left: `${breakAt}%`, animation: "pulse 1s ease-in-out infinite" }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-semibold">
          <span className="text-amber-900">Principal</span>
          {step >= 2 && (
            <span className="text-[var(--ub-red-dark)]">Penalty zone</span>
          )}
        </div>
      </div>
      <div
        className={`rounded border p-2 text-center text-[11px] font-medium transition-all duration-500 ${
          step >= 3
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--fg-muted)]"
        }`}
      >
        {step >= 3 ? "Net proceeds credited to savings account" : "Awaiting break confirmation…"}
      </div>
    </div>
  );
}

function OverrideLimitViz({ step }: { step: number }) {
  const chain = [
    { label: "Employee", sub: "Initiating request" },
    { label: "Branch Manager", sub: "Authority verified" },
    { label: "System Override", sub: "Limit delta applied" },
  ];
  return (
    <div className="space-y-2 py-2">
      {chain.map((node, i) => (
        <div
          key={node.label}
          style={{ transitionDelay: `${i * 160}ms` }}
          className={`flex items-center gap-3 rounded-md border px-3 py-2.5 transition-all duration-500 ${
            step > i
              ? "border-[var(--ub-red-100)] bg-[var(--ub-red-50)]"
              : "border-[var(--border)] bg-[var(--bg-soft)]"
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              step > i ? "bg-[var(--ub-red)]" : "bg-[var(--border-strong)]"
            }`}
          />
          <div className="flex-1">
            <div
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                step > i ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"
              }`}
            >
              {node.label}
            </div>
            {step > i && (
              <div className="text-[10px] text-[var(--ub-red-dark)]">{node.sub}</div>
            )}
          </div>
          {step > i && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--ub-red-dark)]">
              OVERRIDDEN
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfigChangeViz({ step }: { step: number }) {
  const nodes = [
    { label: "API Gateway", icon: "⬡" },
    { label: "Auth Service", icon: "⬡" },
    { label: "DB Cluster", icon: "⬡" },
    { label: "Cache Layer", icon: "⬡" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 py-2">
      {nodes.map((n, i) => (
        <div
          key={n.label}
          style={{ transitionDelay: `${i * 180}ms` }}
          className={`rounded-md border p-3 text-center transition-all duration-500 ${
            step > i
              ? "border-[var(--ub-blue-100)] bg-[var(--ub-blue-50)]"
              : "border-[var(--border)] bg-[var(--bg-soft)]"
          }`}
        >
          <div className={`text-lg ${step > i ? "text-[var(--ub-blue)]" : "text-[var(--fg-muted)]"}`}>
            {n.icon}
          </div>
          <div
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              step > i ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"
            }`}
          >
            {n.label}
          </div>
          <div
            className={`mt-0.5 text-[9px] font-medium transition-all duration-300 ${
              step > i ? "text-emerald-600" : "text-[var(--fg-muted)]"
            }`}
          >
            {step > i ? "Updated ✓" : "Pending…"}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

interface Props {
  action: OperationAction;
  amount?: string;
  accountIds?: string[];
  recordCount?: string;
  account?: string;
  onComplete?: () => void;
}

export function OperationSimulator({ action, accountIds, recordCount, onComplete }: Props) {
  const steps = STEPS[action];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setCurrentStep(0);
    const delays = [500, 1050, 1600, 2150];
    const timers = delays.map((ms, i) => setTimeout(() => setCurrentStep(i + 1), ms));
    // Fire onComplete 450 ms after last step so user sees all checks green
    const doneTimer = setTimeout(() => onComplete?.(), 2150 + 450);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const vizStep = currentStep;

  return (
    <div className="space-y-4">
      {/* Sweeping progress bar */}
      <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-soft)]">
        <div className="sim-bar h-full rounded-full" />
      </div>

      {/* Central visualisation */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
          Live Simulation
        </div>

        {action === "TRANSACTION_INITIATE" && <TransactionViz step={vizStep} />}
        {action === "ACCOUNT_VIEW" && <AccountViewViz step={vizStep} />}
        {action === "BULK_ACCOUNT_ACCESS" && (
          <BulkAccessViz step={vizStep} count={accountIds?.length ?? 6} />
        )}
        {action === "BULK_DATA_EXPORT" && (
          <BulkExportViz step={vizStep} total={Number(recordCount) || 847} />
        )}
        {action === "FD_BREAK" && <FDBreakViz step={vizStep} />}
        {action === "OVERRIDE_LIMIT" && <OverrideLimitViz step={vizStep} />}
        {action === "CONFIG_CHANGE" && <ConfigChangeViz step={vizStep} />}
      </div>

      {/* Step checklist */}
      <ol className="space-y-1.5">
        {steps.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <li
              key={i}
              style={{ transitionDelay: `${i * 40}ms` }}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-all duration-300 ${
                done
                  ? "bg-emerald-50"
                  : active
                    ? "bg-[var(--ub-blue-50)]"
                    : "opacity-35"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--ub-blue)]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
              )}
              <span
                className={
                  done
                    ? "font-medium text-emerald-700"
                    : active
                      ? "font-semibold text-[var(--ub-blue)]"
                      : "text-[var(--fg-muted)]"
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <style>{`
        .sim-bar {
          background: linear-gradient(90deg, var(--ub-blue), #f59e0b, var(--ub-blue));
          background-size: 200% 100%;
          animation: sim-sweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes sim-sweep {
          0%   { background-position: 100% 0; width: 40%; margin-left: 0%; }
          50%  { background-position: 0% 0;   width: 50%; margin-left: 50%; }
          100% { background-position: 100% 0; width: 40%; margin-left: 100%; }
        }
        @keyframes tx-slide {
          0%,100% { transform: translateX(0); opacity: 1; }
          50%      { transform: translateX(8px); opacity: 0.5; }
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
