"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Panel } from "@/components/ub/Panel";
import { RelationshipGraph } from "@/components/graph/RelationshipGraph";
import { Button } from "@/components/ub/Button";

export default function GraphPage() {
  const t = useTranslations();
  const [pending, setPending] = useState("EMP_00007");
  const [active, setActive] = useState(pending);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">{t("graph.title")}</h1>
          <p className="text-sm text-[var(--fg-muted)]">{t("graph.subtitle")}</p>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setActive(pending);
          }}
        >
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              {t("graph.employeeId")}
            </span>
            <input
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              className="rounded-md border border-[var(--border-strong)] bg-white px-3 py-1.5 text-sm focus:border-[var(--ub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <Button type="submit">{t("graph.load")}</Button>
        </form>
      </div>

      <Panel>
        <Legend />
        <div className="mt-3">
          <RelationshipGraph employeeId={active} height={640} />
        </div>
      </Panel>
    </div>
  );
}

function Legend() {
  const t = useTranslations("graph.legend");
  const items = [
    { tKey: "employee", color: "#003B71" },
    { tKey: "dependent", color: "#FFB81C" },
    { tKey: "customer", color: "#E30613" },
    { tKey: "account", color: "#cbd5e1" },
    { tKey: "branch", color: "#0f172a" },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-[var(--fg-muted)]">
      {items.map((i) => (
        <div key={i.tKey} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(t as any)(i.tKey)}
        </div>
      ))}
    </div>
  );
}
