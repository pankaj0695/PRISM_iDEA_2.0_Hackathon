import { UnionBankHeader } from "@/components/ub/UnionBankHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <UnionBankHeader
        homeHref="/admin"
        navItems={[
          { href: "/admin", label: "Overview" },
          { href: "/admin/alerts", label: "Alerts" },
          { href: "/admin/graph", label: "Relationship graph" },
          { href: "/admin/whatif", label: "What-If" },
        ]}
      />
      <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
    </div>
  );
}
