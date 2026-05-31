import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SeverityBadge } from "@/components/ub/SeverityBadge";
import { Panel } from "@/components/ub/Panel";
import { BeliefMassBars } from "@/components/alerts/BeliefMassBars";
import { CausalChain } from "@/components/alerts/CausalChain";
import { AlertActions } from "@/components/alerts/AlertActions";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";
import type { Alert, Branch, Employee } from "@/lib/db/schemas";

async function fetchAlert(
  id: string,
): Promise<{ alert: Alert; employee: Employee | null; branch: Branch | null } | null> {
  const jar = await cookies();
  const cookie = jar.toString();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/alerts/${id}`, { headers: { cookie }, cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const data = await fetchAlert(id);
  if (!data) notFound();
  const { alert, employee, branch } = data;

  const jar = await cookies();
  const user = await verifyToken(jar.get(COOKIE_NAME)?.value || "");
  const role = user?.role || "ADMIN";

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/alerts"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ub-blue)] hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> {t("nav.allAlerts")}
        </Link>
      </div>

      <header className="ub-card-elevated relative overflow-hidden p-4">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--ub-red)]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={alert.severity} pulse={alert.severity === "CRITICAL"} />
              <span className="text-xs text-[var(--fg-muted)]">
                {format(new Date(alert.triggered_at), "PPP p")}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-[var(--fg)]">
              {alert.event_type.replace(/_/g, " ")}
            </h1>
            <div className="mt-1 text-sm text-[var(--fg-muted)]">
              <Link
                href={`/admin/graph?employee_id=${alert.employee_id}`}
                className="font-semibold text-[var(--ub-blue)] hover:underline"
              >
                {employee?.full_name || alert.employee_id}
              </Link>
              {" · "}
              {employee?.designation || ""}
              {" · "}
              {t("common.branch")} {branch?.branch_name || alert.branch_id}
              {branch?.city ? ` (${branch.city})` : ""}
            </div>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2 text-right">
            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
              {t("alert.riskScore")}
            </div>
            <div className="text-3xl font-bold tabular-nums text-[var(--sev-critical)]">
              {Math.round(alert.risk_score * 100)}
            </div>
            <div className="text-[10px] text-[var(--fg-muted)]">
              L1 {Math.round(alert.layer1.score * 100)} · L2 {Math.round(alert.layer2.score * 100)}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <BeliefMassBars title={t("alert.beliefLayer1")} masses={alert.layer1.belief} />
        <BeliefMassBars title={t("alert.beliefLayer2")} masses={alert.layer2.belief} />
        <BeliefMassBars title={t("alert.beliefFused")} masses={alert.fused_belief} />
      </div>

      <Panel title={t("alert.narrative")}>
        <p className="text-sm leading-6 text-[var(--fg)]">{alert.causal_chain_text}</p>
      </Panel>

      <CausalChain steps={alert.causal_chain} chainProbability={alert.chain_probability} />

      <AlertActions alert={alert} role={role} />

      <Panel title="Detector metadata" className="text-xs">
        <dl className="grid gap-2 sm:grid-cols-2">
          <dt className="font-medium text-[var(--fg-muted)]">Detector version</dt>
          <dd className="font-mono text-[var(--fg)]">{alert.detector_version}</dd>
          <dt className="font-medium text-[var(--fg-muted)]">Alert ID</dt>
          <dd className="font-mono text-[var(--fg)]">{alert.alert_id}</dd>
          <dt className="font-medium text-[var(--fg-muted)]">{t("alert.status")}</dt>
          <dd>{alert.status.replace(/_/g, " ")}</dd>
          <dt className="font-medium text-[var(--fg-muted)]">Community distance (L1)</dt>
          <dd>{alert.layer1.community_distance ?? "—"}</dd>
        </dl>
      </Panel>
    </div>
  );
}
