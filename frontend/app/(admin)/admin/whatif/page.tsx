import { getTranslations } from "next-intl/server";
import { WhatIfSimulator } from "@/components/whatif/WhatIfSimulator";

export default async function WhatIfPage() {
  const t = await getTranslations();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--fg)]">{t("whatIf.title")}</h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("whatIf.subtitle")}</p>
      </div>
      <WhatIfSimulator />
    </div>
  );
}
