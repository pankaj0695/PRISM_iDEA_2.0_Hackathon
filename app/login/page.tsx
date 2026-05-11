"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ub/Button";
import { Shield } from "lucide-react";

const DEMO_USERS = [
  { code: "EMP_00001", label: "Admin / Fraud Analyst (auto-derived)" },
  { code: "EMP_00007", label: "Branch Manager / Operations" },
  { code: "EMP_00050", label: "Employee (Branch Operations)" },
];

export default function LoginPage() {
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
    <main className="min-h-screen bg-[var(--bg-soft)]">
      <div className="h-1.5 bg-[var(--ub-red)]" />
      <div className="bg-[var(--ub-blue)] py-2 text-center text-[11px] tracking-[0.18em] text-white/80 uppercase">
        Union Bank of India · iDEA 2.0 Hackathon · Team GangOfFour
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 lg:grid-cols-[1fr_420px]">
        <section className="hidden flex-col justify-center gap-4 lg:flex">
          <div className="flex items-center gap-3">
            <Image src="/PRISM_logo.png" alt="PRISM" width={56} height={56} className="rounded-full" />
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                Privileged-user Risk Identification & Surveillance Monitoring
              </div>
              <div className="text-3xl font-semibold text-[var(--ub-blue)]">PRISM</div>
            </div>
          </div>
          <h1 className="text-balance text-2xl font-semibold text-[var(--fg)]">
            AI-powered early warning for insider fraud — explainable in plain English.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-[var(--fg-muted)]">
            Two complementary detection layers — graph relationships and behavioural anomalies — are
            fused via Dempster–Shafer evidence theory. Every alert carries a causal chain narrative
            so investigators see <em>what</em> happened, in <em>what</em> order, with <em>what</em>{" "}
            probability.
          </p>
          <ul className="space-y-2 text-sm text-[var(--fg)]">
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ub-red)]" /> Designed for the
              FD-break / fund-routing scenario flagged by Ms. A. Manimekhalai
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ub-blue)]" /> Three role-aware
              dashboards — Admin, Manager, Employee
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ub-yellow)]" /> Phase 1 data
              live · Phase 2 model artifacts drop in behind a single seam
            </li>
          </ul>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2 text-[var(--ub-blue)]">
            <Shield className="h-5 w-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Sign in</h2>
          </div>
          <form className="space-y-3" onSubmit={submit}>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Employee code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="EMP_00001"
                className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm focus:border-[var(--ub-blue)] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Password
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm focus:border-[var(--ub-blue)] focus:outline-none"
              />
            </label>
            {error && (
              <div className="rounded-md border border-[var(--ub-red)] bg-[var(--ub-red-50)] px-3 py-2 text-sm text-[var(--ub-red-dark)]">
                {error}
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Demo accounts (password: prism123)
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--fg-muted)]">
              {DEMO_USERS.map((u) => (
                <li key={u.code}>
                  <button
                    type="button"
                    onClick={() => setCode(u.code)}
                    className="font-mono text-[var(--ub-blue)] hover:underline"
                  >
                    {u.code}
                  </button>{" "}
                  — {u.label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-[var(--fg-muted)]">
              Role is auto-derived from the employee&rsquo;s <span className="font-mono">role_category</span>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
