"use client";

import { useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Panel } from "@/components/ub/Panel";
import { AlertList } from "@/components/alerts/AlertList";

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "WATCH", "CLEAR"] as const;

export default function AdminAlertsPage() {
  const t = useTranslations();
  const [sev, setSev] = useState<(typeof SEVERITIES)[number]>("ALL");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">{t("nav.allAlerts")}</h1>
          <p className="text-sm text-[var(--fg-muted)]">{t("feed.liveSubtitle")}</p>
        </div>
        <div className="ub-card flex gap-1 p-1">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              className={clsx(
                "rounded px-2.5 py-1 text-xs font-semibold transition",
                sev === s
                  ? "bg-[var(--ub-blue)] text-white shadow-sm"
                  : "text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]",
              )}
              onClick={() => setSev(s)}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {s === "ALL" ? t("common.all") : (t as any)(`severity.${s}`)}
            </button>
          ))}
        </div>
      </div>
      <Panel>
        <AlertList basePath="/admin/alerts" severity={sev === "ALL" ? undefined : sev} />
      </Panel>
    </div>
  );
}
