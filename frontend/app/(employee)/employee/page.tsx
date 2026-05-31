import Link from "next/link";
import { cookies } from "next/headers";
import { Activity, MessageSquare, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Panel } from "@/components/ub/Panel";
import { KpiCard } from "@/components/ub/KpiCard";
import { Button } from "@/components/ub/Button";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";
import { getBaseUrl } from "@/lib/api/base-url";

async function fetchMe() {
  const jar = await cookies();
  const cookie = jar.toString();
  try {
    const r = await fetch(`${getBaseUrl()}/api/me/activity?limit=10`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function EmployeeHome() {
  const t = await getTranslations();
  const jar = await cookies();
  const user = await verifyToken(jar.get(COOKIE_NAME)?.value || "");
  const data = await fetchMe();
  const activity = data?.activity || [];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ub-blue)]">
          {t("brand.owner")}
        </div>
        <h1 className="text-2xl font-bold text-[var(--fg)]">
          {t("employee.welcome", { name: user?.name || "" })}
        </h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("employee.subtitle")}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label={t("kpi.recentActions")}
          value={activity.length.toString()}
          accent="blue"
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          label={t("kpi.devices")}
          value={(data?.devices?.length ?? 0).toString()}
          accent="green"
          icon={<Shield className="h-4 w-4" />}
        />
        <KpiCard
          label={t("kpi.disclosures")}
          value="—"
          hint={t("kpi.disclosuresHint")}
          accent="yellow"
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </section>

      <Panel title={t("employee.recordedTitle")}>
        <pre className="whitespace-pre-wrap text-sm leading-7 text-[var(--fg)]">
          {t("employee.recordedBullets")}
        </pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/employee/activity">
            <Button>
              <Activity className="h-4 w-4" /> {t("employee.openActivity")}
            </Button>
          </Link>
          <Link href="/employee/disclosure">
            <Button variant="secondary">
              <MessageSquare className="h-4 w-4" /> {t("employee.submitDisclosure")}
            </Button>
          </Link>
        </div>
      </Panel>
    </div>
  );
}
