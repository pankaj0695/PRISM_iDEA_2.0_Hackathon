import { UnionBankHeader } from "@/components/ub/UnionBankHeader";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <UnionBankHeader
        homeHref="/manager"
        navItems={[
          { href: "/manager", labelKey: "nav.queue" },
          { href: "/manager/operations", labelKey: "nav.operations" },
          { href: "/manager/alerts", labelKey: "nav.allAlerts" },
          { href: "/manager/whatif", labelKey: "nav.whatIf" },
        ]}
      />
      <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
    </div>
  );
}
