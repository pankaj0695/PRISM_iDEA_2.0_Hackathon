"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, Shield } from "lucide-react";

interface MeUser {
  employee_id: string;
  employee_code: string;
  name: string;
  role: string;
  branch_id: string;
}

export function UnionBankHeader({
  homeHref,
  navItems,
}: {
  homeHref: string;
  navItems: { href: string; label: string }[];
}) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30">
      {/* UB red strip */}
      <div className="h-1.5 bg-[var(--ub-red)]" />
      {/* UB blue band */}
      <div className="bg-[var(--ub-blue)] text-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center px-6">
          <Link href={homeHref} className="flex items-center gap-3">
            <span className="rounded-full bg-white p-1.5 shadow-sm">
              <Image src="/PRISM_logo.png" alt="PRISM" width={32} height={32} className="rounded-full object-contain" />
            </span>
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Union Bank of India</div>
              <div className="text-lg font-semibold">PRISM</div>
            </div>
          </Link>

          <nav className="ml-10 hidden gap-1 md:flex">
            {navItems.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
              >
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 md:inline-flex">
              <Shield className="h-3.5 w-3.5" />
              Insider Fraud Early Warning
            </span>
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--ub-red)] text-xs font-semibold">
                  {(user?.name || "??").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <div className="text-left leading-tight">
                  <div className="text-[11px] text-white/70">{user?.role || "—"}</div>
                  <div className="text-sm font-medium">{user?.name || "Loading…"}</div>
                </div>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-black/10 bg-white text-[var(--fg)] shadow-lg">
                  <div className="px-3 py-2 text-xs text-[var(--fg-muted)]">
                    Signed in as
                    <div className="text-sm font-medium text-[var(--fg)]">{user?.employee_code}</div>
                    <div className="text-xs">Branch {user?.branch_id}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 border-t border-black/5 px-3 py-2 text-sm hover:bg-[var(--bg-muted)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
