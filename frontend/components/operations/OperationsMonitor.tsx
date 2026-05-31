"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Radio } from "lucide-react";
import { SeverityBadge } from "@/components/ub/SeverityBadge";
import type { Alert } from "@/lib/db/schemas";

/* ── Colour helpers ─────────────────────────────────────────────── */

const SEV_ACCENT: Record<string, string> = {
  CRITICAL: "bg-[var(--sev-critical)]",
  HIGH: "bg-[var(--sev-high)]",
  WATCH: "bg-[var(--sev-watch)]",
  CLEAR: "bg-[var(--sev-clear)]",
};

function scoreColor(n: number) {
  if (n >= 75) return "text-[var(--sev-critical)]";
  if (n >= 50) return "text-[var(--sev-high)]";
  if (n >= 25) return "text-[var(--sev-watch)]";
  return "text-[var(--sev-clear)]";
}

function scoreRingColor(n: number) {
  if (n >= 75) return "var(--sev-critical)";
  if (n >= 50) return "var(--sev-high)";
  if (n >= 25) return "var(--sev-watch)";
  return "var(--sev-clear)";
}

/* ── Sub-components ─────────────────────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div className="relative flex h-[56px] w-[56px] shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--bg-muted)" strokeWidth="4.5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={scoreRingColor(score)}
          strokeWidth="4.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
        />
      </svg>
      <span className={`text-[13px] font-bold tabular-nums ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] font-semibold shadow-sm">
      <span className="text-[var(--fg-muted)]">{label}</span>
      <span className={`tabular-nums ${scoreColor(value)}`}>{value}</span>
    </span>
  );
}

function BeliefBar({
  masses,
}: {
  masses: { fraud: number; uncertain: number; legitimate: number };
}) {
  const f = Math.round(masses.fraud * 100);
  const u = Math.round(masses.uncertain * 100);
  const l = Math.round(masses.legitimate * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)] ring-1 ring-inset ring-black/5">
        <div
          style={{ width: `${f}%`, background: "var(--sev-critical)" }}
          title={`Fraud ${f}%`}
        />
        <div
          style={{ width: `${u}%`, background: "var(--sev-watch)" }}
          title={`Uncertain ${u}%`}
        />
        <div
          style={{ width: `${l}%`, background: "var(--sev-clear)" }}
          title={`Legitimate ${l}%`}
        />
      </div>
      <div className="flex gap-3 text-[10px] text-[var(--fg-muted)]">
        <span>
          <span className="mr-0.5 inline-block h-1.5 w-1.5 rounded-sm align-middle" style={{ background: "var(--sev-critical)" }} />
          Fraud {f}%
        </span>
        <span>
          <span className="mr-0.5 inline-block h-1.5 w-1.5 rounded-sm align-middle" style={{ background: "var(--sev-watch)" }} />
          Uncertain {u}%
        </span>
        <span>
          <span className="mr-0.5 inline-block h-1.5 w-1.5 rounded-sm align-middle" style={{ background: "var(--sev-clear)" }} />
          Legitimate {l}%
        </span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────── */

interface ListResponse {
  items: Alert[];
}

export function OperationsMonitor({ basePath }: { basePath: string }) {
  const [live, setLive] = useState<Alert[]>([]);
  const newIds = useRef<Set<string>>(new Set());

  const { data } = useQuery<ListResponse>({
    queryKey: ["ops-monitor"],
    queryFn: async () => {
      const r = await fetch("/api/alerts?limit=10", { credentials: "include" });
      return r.json();
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const es = new EventSource("/api/realtime", { withCredentials: true });
    es.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data) as { type: string; alert?: Alert };
        if (ev.type === "alert.new" && ev.alert) {
          newIds.current.add(ev.alert.alert_id);
          setLive((p) => [ev.alert!, ...p].slice(0, 10));
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  const alerts = useMemo(() => {
    const seen = new Set<string>();
    const out: Alert[] = [];
    for (const a of [...live, ...(data?.items ?? [])]) {
      if (seen.has(a.alert_id)) continue;
      seen.add(a.alert_id);
      out.push(a);
    }
    return out.slice(0, 10);
  }, [live, data]);

  if (alerts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border-strong)] p-10 text-center text-sm text-[var(--fg-muted)]">
        No flagged operations yet. Execute operations from the manager or employee dashboard to see live detections here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Live indicator */}
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ub-blue)]">
        <Radio className="h-3.5 w-3.5" />
        Live · auto-refreshing
      </div>

      {alerts.map((a) => {
        const risk = Math.round(a.risk_score * 100);
        const l1 = Math.round(a.layer1.score * 100);
        const l2 = Math.round(a.layer2.score * 100);
        const isNew = newIds.current.has(a.alert_id);

        return (
          <Link
            key={a.alert_id}
            href={`${basePath}/${a.alert_id}`}
            className={`group relative flex overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-[1px] ${isNew ? "ub-anim-in" : ""}`}
          >
            {/* Left severity bar */}
            <div className={`w-1.5 shrink-0 ${SEV_ACCENT[a.severity] ?? "bg-[var(--fg-muted)]"}`} />

            <div className="flex flex-1 flex-wrap items-start gap-4 px-4 py-4">
              {/* Score ring */}
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={risk} />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  Risk
                </span>
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1 space-y-2.5">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={a.severity} pulse={a.severity === "CRITICAL"} />
                  <span className="text-[13px] font-bold tracking-tight text-[var(--fg)]">
                    {a.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="ml-auto text-[11px] text-[var(--fg-muted)]">
                    {formatDistanceToNow(new Date(a.triggered_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Employee + branch */}
                <div className="text-[12px] text-[var(--fg-muted)]">
                  <span className="font-semibold text-[var(--fg)]">{a.employee_name || a.employee_id}</span>
                  {" · Branch "}
                  <span className="font-medium text-[var(--fg)]">{a.branch_id}</span>
                </div>

                {/* Score chips */}
                <div className="flex flex-wrap gap-2">
                  <ScoreChip label="Layer 1" value={l1} />
                  <ScoreChip label="Layer 2" value={l2} />
                  <ScoreChip label="Fused" value={risk} />
                </div>

                {/* Fused belief bar */}
                <BeliefBar masses={a.fused_belief} />

                {/* Narrative snippet */}
                {a.causal_chain_text && (
                  <p className="line-clamp-2 text-[11px] text-[var(--fg-muted)]">
                    {a.causal_chain_text}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="flex items-center self-center">
                <ChevronRight className="h-5 w-5 text-[var(--border-strong)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ub-blue)]" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
