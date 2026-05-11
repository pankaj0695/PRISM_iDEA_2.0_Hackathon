"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LockKeyhole, ChevronRight } from "lucide-react";
import { Button } from "@/components/ub/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const DEMO_USERS = [
  { code: "EMP_00007", tKey: "login.demoAdmin" },
  { code: "EMP_00001", tKey: "login.demoManager" },
  { code: "EMP_00050", tKey: "login.demoEmployee" },
];

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("prism123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ employee_code: code, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Login failed");
      router.push(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Tri-colour Union Bank strip */}
      <div className="ub-divider" />

      {/* Brand row */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-[var(--border)]">
              <Image
                src="/PRISM_logo.png"
                alt="PRISM"
                width={28}
                height={28}
                className="rounded-full object-contain"
              />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-bold text-[var(--ub-red)]">
                यूनियन बैंक
              </span>
              <span className="block text-[11px] font-semibold text-[var(--ub-blue)]">
                Union Bank of India
              </span>
            </span>
          </div>
          <div className="ml-auto">
            <div className="rounded-full bg-[var(--ub-blue)] p-0.5">
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="ub-card-elevated grid overflow-hidden lg:grid-cols-[1.1fr_440px]">
            {/* Left — concise hero panel: logo, title (full form), tagline */}
            <section
              className="relative hidden flex-col items-center justify-center gap-6 p-10 text-center text-white lg:flex"
              style={{ background: "var(--grad-hero)" }}
            >
              {/* decorative grid */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                  maskImage:
                    "radial-gradient(ellipse at center, black, transparent 70%)",
                }}
              />

              <div className="relative grid h-24 w-24 place-items-center rounded-full bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-4 ring-white/20">
                <Image
                  src="/PRISM_logo.png"
                  alt="PRISM"
                  width={80}
                  height={80}
                  className="rounded-full object-contain"
                  priority
                />
              </div>

              <div className="relative">
                <h1 className="text-5xl font-extrabold tracking-tight text-white">
                  {t("brand.name")}
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-white/90">
                  {t("brand.tagline")}
                </p>
              </div>
            </section>

            {/* Right — login form */}
            <section className="bg-white p-7 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--ub-blue-50)] text-[var(--ub-blue)]">
                  <LockKeyhole className="h-4.5 w-4.5" />
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                    PRISM
                  </div>
                  <h2 className="text-lg font-bold text-[var(--fg)]">
                    {t("login.title")}
                  </h2>
                </div>
              </div>

              <form className="space-y-3" onSubmit={submit}>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    {t("login.employeeCode")}
                  </span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="EMP_00007"
                    className="w-full rounded-md border border-[var(--border-strong)] bg-white px-3 py-2.5 text-sm font-medium tracking-wide focus:border-[var(--ub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    {t("login.password")}
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    className="w-full rounded-md border border-[var(--border-strong)] bg-white px-3 py-2.5 text-sm focus:border-[var(--ub-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </label>
                {error && (
                  <div className="rounded-md border border-[var(--ub-red)] bg-[var(--ub-red-50)] px-3 py-2 text-sm text-[var(--ub-red-dark)]">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full"
                  size="lg"
                >
                  {busy ? t("login.signingIn") : t("login.signIn")}
                  {!busy && <ChevronRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  {t("login.demoAccounts")}
                </p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {DEMO_USERS.map((u) => (
                    <li key={u.code} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCode(u.code)}
                        className="inline-flex items-center rounded-md bg-[var(--ub-blue-50)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--ub-blue)] hover:bg-[var(--ub-blue-100)]"
                      >
                        {u.code}
                      </button>
                      <span className="text-[var(--fg-muted)]">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        — {(t as any)(u.tKey)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-[var(--fg-muted)]">
                  {t("login.demoNote")}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="bg-white py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 text-[11px] text-[var(--fg-muted)]">
          <span>{t("brand.bannerStrip")}</span>
          <span>© Union Bank of India · iDEA 2.0 Hackathon</span>
        </div>
      </footer>
    </main>
  );
}
