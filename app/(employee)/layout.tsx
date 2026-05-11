import { UnionBankHeader } from "@/components/ub/UnionBankHeader";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <UnionBankHeader
        homeHref="/employee"
        navItems={[
          { href: "/employee", labelKey: "nav.overview" },
          { href: "/employee/activity", labelKey: "nav.myActivity" },
          { href: "/employee/disclosure", labelKey: "nav.disclosure" },
        ]}
      />
      <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
    </div>
  );
}
