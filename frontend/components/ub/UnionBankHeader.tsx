"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

interface MeUser {
  employee_id: string;
  employee_code: string;
  name: string;
  role: string;
  branch_id: string;
}

interface NavItem {
  href: string;
  labelKey: string; // i18n key, e.g. "nav.overview"
}

export function UnionBankHeader({
  homeHref,
  navItems,
}: {
  homeHref: string;
  navItems: NavItem[];
}) {
  const t = useTranslations();
  const [user, setUser] = useState<MeUser | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  const initials = (user?.name || "??")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30">
      {/* Accent bar */}
      <div className="ub-divider" />

      {/* Brand row */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-6">
          <Link href={homeHref} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-[var(--border)]">
              <Image
                src="/PRISM_logo.png"
                alt="PRISM"
                width={32}
                height={32}
                className="rounded-full object-contain"
              />
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-extrabold tracking-tight text-[var(--fg)]">
                PRISM
              </span>
              <span className="block text-[11px] text-[var(--fg-muted)] max-w-[260px] truncate">
                {t("brand.tagline")}
              </span>
            </span>
          </Link>

          <span className="ml-3 hidden items-center gap-1.5 rounded-full bg-[var(--ub-blue-50)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ub-blue)] lg:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Insider Fraud Early Warning
          </span>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-full bg-[var(--ub-blue)] p-0.5 md:block">
              <LanguageSwitcher compact />
            </div>
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-2 py-1.5 text-sm shadow-sm hover:bg-[var(--bg-soft)]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--ub-blue)] text-xs font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                    {user?.role || "—"}
                  </span>
                  <span className="block text-[13px] font-semibold text-[var(--fg)]">
                    {user?.name || t("common.loading")}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl">
                    <div className="bg-[var(--ub-blue)] px-3 py-3 text-white">
                      <div className="text-[10px] uppercase tracking-wider opacity-80">
                        {t("common.signedInAs")}
                      </div>
                      <div className="mt-0.5 text-sm font-semibold">{user?.name}</div>
                      <div className="text-[11px] opacity-90">
                        {user?.employee_code} · {t("common.branch")} {user?.branch_id}
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)]"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("common.signOut")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deep-blue nav band */}
      <div className="ub-grad-blue">
        <nav className="mx-auto flex h-11 max-w-[1400px] items-center gap-1 px-6">
          {navItems.map((it) => {
            const active =
              pathname === it.href ||
              (it.href !== "/" && pathname?.startsWith(it.href + "/"));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                {/* next-intl typings don't know the dynamic key, but it's safe */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(t as any)(it.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
