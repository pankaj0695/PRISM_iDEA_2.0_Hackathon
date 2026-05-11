"use client";

import { useState } from "react";
import { Panel } from "@/components/ub/Panel";
import { Button } from "@/components/ub/Button";

export default function DisclosurePage() {
  const [form, setForm] = useState({
    external_bank_name: "",
    external_account_number: "",
    ifsc_code: "",
    account_holder_relationship: "Self",
    declared_balance_inr: "",
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/me/disclosure", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          declared_balance_inr: form.declared_balance_inr ? Number(form.declared_balance_inr) : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Submission failed");
      setDone(data.disclosure_id);
      setForm({
        external_bank_name: "",
        external_account_number: "",
        ifsc_code: "",
        account_holder_relationship: "Self",
        declared_balance_inr: "",
        reason: "",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--fg)]">Voluntary disclosure</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          As suggested by Ms. A. Manimekhalai — proactively disclose any external bank accounts you
          hold or operate. This reduces the chance of a false-positive flag against you later.
        </p>
      </div>
      <Panel title="Disclose an external account">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="External bank name">
            <input className="input" required value={form.external_bank_name} onChange={(e) => up("external_bank_name", e.target.value)} />
          </Field>
          <Field label="External account number">
            <input className="input" required value={form.external_account_number} onChange={(e) => up("external_account_number", e.target.value)} />
          </Field>
          <Field label="IFSC (if known)">
            <input className="input" value={form.ifsc_code} onChange={(e) => up("ifsc_code", e.target.value)} />
          </Field>
          <Field label="Holder relationship">
            <select className="input" value={form.account_holder_relationship} onChange={(e) => up("account_holder_relationship", e.target.value)}>
              <option>Self</option>
              <option>Spouse</option>
              <option>Parent</option>
              <option>Child</option>
              <option>Other family</option>
              <option>Joint with non-family</option>
            </select>
          </Field>
          <Field label="Declared balance (₹)">
            <input className="input" type="number" min={0} value={form.declared_balance_inr} onChange={(e) => up("declared_balance_inr", e.target.value)} />
          </Field>
          <Field label="Reason / context" wide>
            <textarea className="input" required rows={3} value={form.reason} onChange={(e) => up("reason", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit disclosure"}
            </Button>
            {done && (
              <span className="ml-3 text-sm text-[var(--clear)]">
                Submitted. Reference: <span className="font-mono">{done}</span>
              </span>
            )}
            {error && <span className="ml-3 text-sm text-[var(--critical)]">{error}</span>}
          </div>
        </form>
        <style jsx>{`
          .input {
            width: 100%;
            border: 1px solid var(--border-strong);
            border-radius: 6px;
            padding: 6px 8px;
            font-size: 13px;
            background: white;
          }
          .input:focus {
            outline: none;
            border-color: var(--ub-blue);
          }
        `}</style>
      </Panel>
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "block sm:col-span-2" : "block"}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
