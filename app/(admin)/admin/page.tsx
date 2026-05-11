import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  Activity,
  AlertTriangle,
  Building2,
  Database,
  Users,
  GitBranch,
  Wand2,
} from "lucide-react";
import { KpiCard } from "@/components/ub/KpiCard";
import { Panel } from "@/components/ub/Panel";
import { AlertList } from "@/components/alerts/AlertList";
import { SeverityTrend } from "@/components/charts/SeverityTrend";
import { Button } from "@/components/ub/Button";

interface Overview {
  collections: {
    branches: number;
    employees: number;
    customers: number;
    accounts: number;
    transactions: number;
    activity_logs: number;
    dependents: number;
  };
  alerts: { total: number; critical: number; by_severity: Record<string, number> };
  suspicious: { transactions: number; activity_logs: number };
  accounts_dormant: number;
}

async function fetchOverview(): Promise<Overview | null> {
  const jar = await cookies();
  const cookie = jar.toString();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const r = await fetch(`${base}/api/stats/overview`, {
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

export default async function AdminHome() {
  const t = await getTranslations();
  const o = await fetchOverview();
  const c = o?.collections;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ub-blue)]">
            {t("brand.owner")}
          </div>
          <h1 className="text-2xl font-bold text-[var(--fg)]">{t("admin.title")}</h1>
          <p className="text-sm text-[var(--fg-muted)]">{t("admin.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/whatif">
            <Button variant="secondary">
              <Wand2 className="h-4 w-4" /> {t("admin.openWhatIf")}
            </Button>
          </Link>
          <Link href="/admin/graph">
            <Button>
              <GitBranch className="h-4 w-4" /> {t("admin.openGraph")}
            </Button>
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("kpi.criticalAlerts")}
          value={fmt(o?.alerts.by_severity?.CRITICAL)}
          hint={t("kpi.totalOpen", { n: fmt(o?.alerts.total) })}
          accent="red"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label={t("kpi.suspiciousEvents")}
          value={fmt((o?.suspicious.transactions ?? 0) + (o?.suspicious.activity_logs ?? 0))}
          hint={t("kpi.txnsAndLogs", {
            tx: fmt(o?.suspicious.transactions),
            logs: fmt(o?.suspicious.activity_logs),
          })}
          accent="yellow"
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          label={t("kpi.dormantAccounts")}
          value={fmt(o?.accounts_dormant)}
          hint={t("kpi.dormantHint")}
          accent="blue"
          icon={<Database className="h-4 w-4" />}
        />
        <KpiCard
          label={t("kpi.branchesMonitored")}
          value={fmt(c?.branches)}
          hint={t("kpi.branchesHint", {
            employees: fmt(c?.employees),
            customers: fmt(c?.customers),
          })}
          accent="green"
          icon={<Building2 className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("kpi.accounts")} value={fmt(c?.accounts)} icon={<Database className="h-4 w-4" />} />
        <KpiCard label={t("kpi.transactions")} value={fmt(c?.transactions)} icon={<Database className="h-4 w-4" />} />
        <KpiCard label={t("kpi.activityLogs")} value={fmt(c?.activity_logs)} icon={<Activity className="h-4 w-4" />} />
        <KpiCard label={t("kpi.dependents")} value={fmt(c?.dependents)} icon={<Users className="h-4 w-4" />} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          eyebrow="LIVE"
          title={t("feed.liveTitle")}
          description={t("feed.liveSubtitle")}
        >
          <AlertList basePath="/admin/alerts" />
        </Panel>
        <Panel title={t("feed.severityTrend")} description={t("feed.severityTrendSubtitle")}>
          <SeverityTrend />
        </Panel>
      </div>
    </div>
  );
}
