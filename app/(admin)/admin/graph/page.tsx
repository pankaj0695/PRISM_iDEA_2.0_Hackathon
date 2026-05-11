"use client";

import { useState } from "react";
import { Panel } from "@/components/ub/Panel";
import { RelationshipGraph } from "@/components/graph/RelationshipGraph";
import { Button } from "@/components/ub/Button";

export default function GraphPage() {
  const [pending, setPending] = useState("EMP_00007");
  const [active, setActive] = useState(pending);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--fg)]">Relationship & beneficiary network</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Graph view used by Layer 1 — dependents, employee accounts, managed customers and the
            counterparty accounts they transact with.
          </p>
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
              Employee ID
            </span>
            <input
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              className="rounded-md border border-[var(--border-strong)] px-3 py-1.5 text-sm focus:border-[var(--ub-blue)] focus:outline-none"
            />
          </label>
          <Button type="submit">Load</Button>
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
  const items = [
    { label: "Employee", color: "#003B71" },
    { label: "Dependent", color: "#FFB81C" },
    { label: "Customer", color: "#E30613" },
    { label: "Account", color: "#cbd5e1" },
    { label: "Branch", color: "#0f172a" },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-[var(--fg-muted)]">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}
