import { getTranslations } from "next-intl/server";
import { OperationsConsole } from "@/components/operations/OperationsConsole";

export default async function ManagerOpsPage() {
  const t = await getTranslations();
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ub-blue)]">
          {t("brand.owner")}
        </div>
        <h1 className="text-2xl font-bold text-[var(--fg)]">{t("operations.title")}</h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("operations.subtitleManager")}</p>
      </div>
      <OperationsConsole scope="MANAGER" />
    </div>
  );
}
