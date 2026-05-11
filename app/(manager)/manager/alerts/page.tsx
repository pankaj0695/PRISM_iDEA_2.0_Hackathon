"use client";

import { useState } from "react";
import clsx from "clsx";
import { Panel } from "@/components/ub/Panel";
import { AlertList } from "@/components/alerts/AlertList";

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "WATCH", "CLEAR"] as const;

export default function ManagerAlertsPage() {
  const [sev, setSev] = useState<(typeof SEVERITIES)[number]>("ALL");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--fg)]">Branch alerts</h1>
          <p className="text-sm text-[var(--fg-muted)]">Scoped to your branch.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-[var(--border)] bg-white p-1">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              className={clsx(
                "rounded px-2.5 py-1 text-xs font-medium",
                sev === s
                  ? "bg-[var(--ub-blue)] text-white"
                  : "text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]",
              )}
              onClick={() => setSev(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <Panel>
        <AlertList basePath="/manager/alerts" severity={sev === "ALL" ? undefined : sev} />
      </Panel>
    </div>
  );
}
