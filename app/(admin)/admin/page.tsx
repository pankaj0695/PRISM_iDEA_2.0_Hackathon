import Link from "next/link";
import { cookies } from "next/headers";
import { Activity, AlertTriangle, Building2, Database, Users } from "lucide-react";
import { KpiCard } from "@/components/ub/KpiCard";
import { Panel } from "@/components/ub/Panel";
import { AlertList } from "@/components/alerts/AlertList";
import { SeverityTrend } from "@/components/charts/SeverityTrend";
import { Button } from "@/components/ub/Button";
import { COOKIE_NAME } from "@/lib/auth/jwt";

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
  const o = await fetchOverview();
  const c = o?.collections;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--fg)]">PRISM Operations Centre</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Live insider-fraud surveillance — alerts fire only when both layers agree.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/whatif"><Button variant="secondary">What-If simulator</Button></Link>
          <Link href="/admin/graph"><Button>Open relationship graph</Button></Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Critical alerts"
          value={fmt(o?.alerts.by_severity?.CRITICAL)}
          hint={`Total open: ${fmt(o?.alerts.total)}`}
          accent="red"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Suspicious events (seeded)"
          value={fmt((o?.suspicious.transactions ?? 0) + (o?.suspicious.activity_logs ?? 0))}
          hint={`${fmt(o?.suspicious.transactions)} txns · ${fmt(o?.suspicious.activity_logs)} logs`}
          accent="yellow"
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          label="Dormant accounts"
          value={fmt(o?.accounts_dormant)}
          hint="Primary anomaly indicator"
          accent="blue"
          icon={<Database className="h-4 w-4" />}
        />
        <KpiCard
          label="Branches monitored"
          value={fmt(c?.branches)}
          hint={`${fmt(c?.employees)} employees · ${fmt(c?.customers)} customers`}
          accent="green"
          icon={<Building2 className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Accounts" value={fmt(c?.accounts)} icon={<Database className="h-4 w-4" />} />
        <KpiCard label="Transactions" value={fmt(c?.transactions)} icon={<Database className="h-4 w-4" />} />
        <KpiCard label="Activity logs" value={fmt(c?.activity_logs)} icon={<Activity className="h-4 w-4" />} />
        <KpiCard label="Dependents" value={fmt(c?.dependents)} icon={<Users className="h-4 w-4" />} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Live alert feed" description="SSE-subscribed. New alerts appear instantly.">
          <AlertList basePath="/admin/alerts" />
        </Panel>
        <Panel title="Severity trend" description="Daily alert distribution by severity.">
          <SeverityTrend />
        </Panel>
      </div>
    </div>
  );
}
