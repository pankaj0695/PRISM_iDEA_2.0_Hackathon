import { cookies } from "next/headers";
import { AlertList } from "@/components/alerts/AlertList";
import { KpiCard } from "@/components/ub/KpiCard";
import { Panel } from "@/components/ub/Panel";
import { AlertTriangle, Building2, Database } from "lucide-react";

async function fetchOverview() {
  const jar = await cookies();
  const cookie = jar.toString();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/stats/overview`, { headers: { cookie }, cache: "no-store" });
  return r.ok ? r.json() : null;
}

function fmt(n: number | undefined) {
  return (n ?? 0).toLocaleString("en-IN");
}

export default async function ManagerHome() {
  const o = await fetchOverview();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--fg)]">Branch investigation queue</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Alerts scoped to your branch. You can dismiss, escalate, or recommend account freeze.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Open alerts in branch"
          value={fmt(o?.alerts.total)}
          hint={`Critical: ${fmt(o?.alerts.by_severity?.CRITICAL)}`}
          accent="red"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Employees"
          value={fmt(o?.collections.employees)}
          hint={`Accounts ${fmt(o?.collections.accounts)}`}
          accent="blue"
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Recent suspicious events"
          value={fmt((o?.suspicious.transactions ?? 0) + (o?.suspicious.activity_logs ?? 0))}
          hint="From the seeded scenarios"
          accent="yellow"
          icon={<Database className="h-4 w-4" />}
        />
      </section>

      <Panel title="Investigation queue">
        <AlertList basePath="/manager/alerts" />
      </Panel>
    </div>
  );
}
