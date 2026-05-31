"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Panel } from "@/components/ub/Panel";
import { DataTable, type Column } from "@/components/ub/DataTable";
import type { ActivityLog } from "@/lib/db/schemas";

interface MyActivity {
  activity: ActivityLog[];
  logins: ActivityLog[];
  devices: { device_id: string; ip_address: string; last_seen: string; count: number }[];
}

export default function MyActivityPage() {
  const t = useTranslations();
  const { data, isLoading } = useQuery<MyActivity>({
    queryKey: ["me-activity"],
    queryFn: async () => {
      const r = await fetch("/api/me/activity?limit=100", { credentials: "include" });
      return r.json();
    },
  });

  if (isLoading) return <div className="text-sm text-[var(--fg-muted)]">{t("common.loading")}</div>;

  const activityCols: Column<ActivityLog>[] = [
    {
      key: "action_datetime",
      header: "When",
      render: (r) => format(new Date(r.action_datetime), "dd MMM yyyy HH:mm"),
    },
    { key: "action_type", header: "Action" },
    { key: "target_entity_type", header: "Target" },
    { key: "target_entity_id", header: "Target ID" },
    { key: "ip_address", header: "IP" },
    { key: "device_id", header: "Device" },
    { key: "status", header: "Status" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--fg)]">{t("employee.activityTitle")}</h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("employee.activitySubtitle")}</p>
      </div>

      <Panel title={t("employee.trustedDevices")}>
        <DataTable
          rows={data?.devices ?? []}
          rowKey={(r) => `${r.device_id}-${r.ip_address}`}
          columns={[
            { key: "device_id", header: "Device" },
            { key: "ip_address", header: "IP" },
            { key: "count", header: "Events" },
            {
              key: "last_seen",
              header: "Last seen",
              render: (r) => format(new Date(r.last_seen), "dd MMM yyyy HH:mm"),
            },
          ]}
        />
      </Panel>

      <Panel title={t("employee.recentLogins")}>
        <DataTable
          rows={data?.logins ?? []}
          rowKey={(r) => r.log_id}
          columns={[
            {
              key: "action_datetime",
              header: "When",
              render: (r) => format(new Date(r.action_datetime), "dd MMM yyyy HH:mm"),
            },
            { key: "ip_address", header: "IP" },
            { key: "device_id", header: "Device" },
            { key: "status", header: "Status" },
          ]}
        />
      </Panel>

      <Panel title={t("employee.recentActions")}>
        <DataTable rows={data?.activity ?? []} rowKey={(r) => r.log_id} columns={activityCols} />
      </Panel>
    </div>
  );
}
