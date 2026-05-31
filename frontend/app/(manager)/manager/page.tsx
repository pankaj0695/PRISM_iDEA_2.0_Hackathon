import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, Building2, Database } from "lucide-react";
import { AlertList } from "@/components/alerts/AlertList";
import { KpiCard } from "@/components/ub/KpiCard";
import { Panel } from "@/components/ub/Panel";
import { getBaseUrl } from "@/lib/api/base-url";

async function fetchOverview() {
  const jar = await cookies();
  const cookie = jar.toString();
  try {
    const r = await fetch(`${getBaseUrl()}/api/stats/overview`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

function fmt(n: number | undefined) {
  return (n ?? 0).toLocaleString("en-IN");
}

export default async function ManagerHome() {
  const t = await getTranslations();
  const o = await fetchOverview();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ub-blue)]">
          {t("brand.owner")}
        </div>
        <h1 className="text-2xl font-bold text-[var(--fg)]">
          {t("manager.title")}
        </h1>
        <p className="text-sm text-[var(--fg-muted)]">
          {t("manager.subtitle")}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label={t("kpi.openAlerts")}
          value={fmt(o?.alerts.total)}
          hint={t("kpi.criticalShort", {
            n: fmt(o?.alerts.by_severity?.CRITICAL),
          })}
          accent="red"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label={t("kpi.employees")}
          value={fmt(o?.collections.employees)}
          hint={t("kpi.employeesHint", { n: fmt(o?.collections.accounts) })}
          accent="blue"
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          label={t("kpi.recent")}
          value={fmt(
            (o?.suspicious.transactions ?? 0) +
              (o?.suspicious.activity_logs ?? 0),
          )}
          hint={t("kpi.recentHint")}
          accent="yellow"
          icon={<Database className="h-4 w-4" />}
        />
      </section>

      <Panel title={t("nav.queue")}>
        <AlertList basePath="/manager/alerts" />
      </Panel>
    </div>
  );
}
