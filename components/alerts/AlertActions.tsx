"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ub/Button";
import type { Alert, AlertStatus } from "@/lib/db/schemas";
import { CheckCircle2, XCircle, AlertTriangle, Snowflake } from "lucide-react";

type Decision = "CONFIRM_FRAUD" | "DISMISS" | "ESCALATE" | "FREEZE_ACCOUNT";

const decisionConfig: Record<
  Decision,
  { label: string; icon: React.ComponentType<{ className?: string }>; variant: "danger" | "primary" | "outline" | "secondary" }
> = {
  CONFIRM_FRAUD: { label: "Confirm fraud", icon: AlertTriangle, variant: "danger" },
  ESCALATE: { label: "Escalate", icon: AlertTriangle, variant: "primary" },
  FREEZE_ACCOUNT: { label: "Freeze account", icon: Snowflake, variant: "secondary" },
  DISMISS: { label: "Dismiss", icon: XCircle, variant: "outline" },
};

export function AlertActions({
  alert,
  role,
}: {
  alert: Alert;
  role: string;
}) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [status, setStatus] = useState<AlertStatus>(alert.status);
  const router = useRouter();

  async function act(decision: Decision) {
    setBusy(decision);
    try {
      const r = await fetch(`/api/alerts/${alert.alert_id}/disposition`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      if (r.ok) {
        const data = await r.json();
        setStatus(data.alert.status);
        router.refresh();
      } else {
        const data = await r.json();
        alert?.alert_id; // noop; we just want to surface the error
        window.alert(data.error || "Action failed");
      }
    } finally {
      setBusy(null);
    }
  }

  const canFreeze = role === "ADMIN" || role === "FRAUD_ANALYST";
  const canRecommendFreeze = role === "BRANCH_MANAGER";

  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Disposition
        </h3>
        <span className="text-[11px] text-[var(--fg-muted)]">
          Status:{" "}
          <span className="font-semibold text-[var(--fg)]">{status.replace(/_/g, " ")}</span>
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Investigation notes / evidence summary…"
        className="mb-3 w-full resize-y rounded-md border border-[var(--border-strong)] px-2.5 py-1.5 text-sm focus:border-[var(--ub-blue)] focus:outline-none"
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <DecisionButton decision="CONFIRM_FRAUD" busy={busy} onClick={act} />
        <DecisionButton decision="ESCALATE" busy={busy} onClick={act} />
        {(canFreeze || canRecommendFreeze) && (
          <DecisionButton
            decision="FREEZE_ACCOUNT"
            busy={busy}
            onClick={act}
            override={canRecommendFreeze ? "Recommend freeze" : undefined}
          />
        )}
        <DecisionButton decision="DISMISS" busy={busy} onClick={act} />
      </div>
    </div>
  );
}

function DecisionButton({
  decision,
  busy,
  onClick,
  override,
}: {
  decision: Decision;
  busy: Decision | null;
  onClick: (d: Decision) => void;
  override?: string;
}) {
  const cfg = decisionConfig[decision];
  const Icon = cfg.icon;
  return (
    <Button
      variant={cfg.variant}
      onClick={() => onClick(decision)}
      disabled={busy !== null}
    >
      <Icon className="h-4 w-4" />
      {busy === decision ? "Working…" : override || cfg.label}
    </Button>
  );
}
