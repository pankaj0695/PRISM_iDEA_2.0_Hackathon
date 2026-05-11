import { WhatIfSimulator } from "@/components/whatif/WhatIfSimulator";

export default function WhatIfPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--fg)]">What-If simulator</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Pose a hypothetical action and see the risk score it would produce — useful for
          calibrating thresholds and tabletop exercises.
        </p>
      </div>
      <WhatIfSimulator />
    </div>
  );
}
