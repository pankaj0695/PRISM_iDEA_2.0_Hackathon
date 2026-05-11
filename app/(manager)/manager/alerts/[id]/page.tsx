import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { SeverityBadge } from "@/components/ub/SeverityBadge";
import { Panel } from "@/components/ub/Panel";
import { BeliefMassBars } from "@/components/alerts/BeliefMassBars";
import { CausalChain } from "@/components/alerts/CausalChain";
import { AlertActions } from "@/components/alerts/AlertActions";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";

async function fetchAlert(id: string) {
  const jar = await cookies();
  const cookie = jar.toString();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/alerts/${id}`, { headers: { cookie }, cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

export default async function ManagerAlertDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchAlert(id);
  if (!data) notFound();
  const { alert, employee, branch } = data;

  const jar = await cookies();
  const user = await verifyToken(jar.get(COOKIE_NAME)?.value || "");
  const role = user?.role || "BRANCH_MANAGER";

  return (
    <div className="space-y-4">
      <div>
        <Link href="/manager" className="text-xs text-[var(--ub-blue)] hover:underline">
          ← Back to queue
        </Link>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <span className="text-xs text-[var(--fg-muted)]">
              {format(new Date(alert.triggered_at), "PPP p")}
            </span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-[var(--fg)]">
            {alert.event_type.replace(/_/g, " ")}
          </h1>
          <div className="mt-1 text-sm text-[var(--fg-muted)]">
            Employee: <span className="font-medium text-[var(--fg)]">{employee?.full_name || alert.employee_id}</span> ·{" "}
            {employee?.designation || ""} · Branch {branch?.branch_name || alert.branch_id}
          </div>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-right">
          <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">Risk score</div>
          <div className="text-3xl font-semibold tabular-nums text-[var(--critical)]">
            {Math.round(alert.risk_score * 100)}
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <BeliefMassBars title="Layer 1 — Graph" masses={alert.layer1.belief} />
        <BeliefMassBars title="Layer 2 — Anomaly" masses={alert.layer2.belief} />
        <BeliefMassBars title="Fused (Dempster–Shafer)" masses={alert.fused_belief} />
      </div>

      <Panel title="Investigator narrative">
        <p className="text-sm leading-6 text-[var(--fg)]">{alert.causal_chain_text}</p>
      </Panel>

      <CausalChain steps={alert.causal_chain} chainProbability={alert.chain_probability} />

      <AlertActions alert={alert} role={role} />
    </div>
  );
}
