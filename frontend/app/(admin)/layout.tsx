import { UnionBankHeader } from "@/components/ub/UnionBankHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <UnionBankHeader
        homeHref="/admin"
        navItems={[
          { href: "/admin", labelKey: "nav.overview" },
          { href: "/admin/alerts", labelKey: "nav.alerts" },
          { href: "/admin/graph", labelKey: "nav.graph" },
        ]}
      />
      <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
    </div>
  );
}
