import Link from "next/link";
import { cookies } from "next/headers";
import { Panel } from "@/components/ub/Panel";
import { KpiCard } from "@/components/ub/KpiCard";
import { Button } from "@/components/ub/Button";
import { Activity, MessageSquare, Shield } from "lucide-react";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";

async function fetchMe() {
  const jar = await cookies();
  const cookie = jar.toString();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/me/activity?limit=10`, { headers: { cookie }, cache: "no-store" });
  return r.ok ? r.json() : null;
}

export default async function EmployeeHome() {
  const jar = await cookies();
  const user = await verifyToken(jar.get(COOKIE_NAME)?.value || "");
  const data = await fetchMe();
  const activity = data?.activity || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--fg)]">Welcome, {user?.name}</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          PRISM keeps a transparent record of every system action attributed to you. This page is
          your view of that record.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Recent actions (30d)"
          value={activity.length.toString()}
          accent="blue"
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          label="Trusted devices"
          value={(data?.devices?.length ?? 0).toString()}
          accent="green"
          icon={<Shield className="h-4 w-4" />}
        />
        <KpiCard
          label="Disclosures filed"
          value="—"
          hint="Submit at /employee/disclosure"
          accent="yellow"
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </section>

      <Panel title="What PRISM records about you" description="Full transparency — review any time.">
        <ul className="grid gap-2 text-sm text-[var(--fg)] sm:grid-cols-2">
          <li>• Logins, device IDs and IP addresses for the last 30 days</li>
          <li>• Customer accounts you viewed and transactions you initiated</li>
          <li>• Approvals you granted and any override actions</li>
          <li>• Voluntary disclosures of external accounts you submit</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <Link href="/employee/activity">
            <Button>Open my activity log</Button>
          </Link>
          <Link href="/employee/disclosure">
            <Button variant="secondary">Submit a voluntary disclosure</Button>
          </Link>
        </div>
      </Panel>
    </div>
  );
}
