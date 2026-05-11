import { WhatIfSimulator } from "@/components/whatif/WhatIfSimulator";

export default function ManagerWhatIfPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--fg)]">What-If simulator</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Pose a hypothetical action — no alert is persisted. Useful for tabletop drills.
        </p>
      </div>
      <WhatIfSimulator />
    </div>
  );
}
