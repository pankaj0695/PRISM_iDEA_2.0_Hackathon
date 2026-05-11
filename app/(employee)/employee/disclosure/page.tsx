"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Panel } from "@/components/ub/Panel";
import { Button } from "@/components/ub/Button";

export default function DisclosurePage() {
  const t = useTranslations();
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
          declared_balance_inr: form.declared_balance_inr
            ? Number(form.declared_balance_inr)
            : undefined,
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
        <h1 className="text-xl font-bold text-[var(--fg)]">{t("disclosure.title")}</h1>
        <p className="text-sm text-[var(--fg-muted)]">{t("disclosure.subtitle")}</p>
      </div>
      <Panel title={t("disclosure.formTitle")}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label={t("disclosure.bankName")}>
            <input
              className="ub-input"
              required
              value={form.external_bank_name}
              onChange={(e) => up("external_bank_name", e.target.value)}
            />
          </Field>
          <Field label={t("disclosure.accountNumber")}>
            <input
              className="ub-input"
              required
              value={form.external_account_number}
              onChange={(e) => up("external_account_number", e.target.value)}
            />
          </Field>
          <Field label={t("disclosure.ifsc")}>
            <input
              className="ub-input"
              value={form.ifsc_code}
              onChange={(e) => up("ifsc_code", e.target.value)}
            />
          </Field>
          <Field label={t("disclosure.relationship")}>
            <select
              className="ub-input"
              value={form.account_holder_relationship}
              onChange={(e) => up("account_holder_relationship", e.target.value)}
            >
              <option>Self</option>
              <option>Spouse</option>
              <option>Parent</option>
              <option>Child</option>
              <option>Other family</option>
              <option>Joint with non-family</option>
            </select>
          </Field>
          <Field label={t("disclosure.balance")}>
            <input
              className="ub-input"
              type="number"
              min={0}
              value={form.declared_balance_inr}
              onChange={(e) => up("declared_balance_inr", e.target.value)}
            />
          </Field>
          <Field label={t("disclosure.reason")} wide>
            <textarea
              className="ub-input"
              required
              rows={3}
              value={form.reason}
              onChange={(e) => up("reason", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} size="lg">
              {busy ? t("disclosure.submitting") : t("disclosure.submit")}
            </Button>
            {done && (
              <span className="ml-3 text-sm text-[var(--sev-clear)]">
                {t("disclosure.submitted", { id: done })}
              </span>
            )}
            {error && <span className="ml-3 text-sm text-[var(--sev-critical)]">{error}</span>}
          </div>
        </form>
        <style jsx>{`
          .ub-input {
            width: 100%;
            border: 1px solid var(--border-strong);
            border-radius: 6px;
            padding: 7px 9px;
            font-size: 13px;
            background: white;
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          .ub-input:focus {
            outline: none;
            border-color: var(--ub-blue);
            box-shadow: 0 0 0 2px var(--ring);
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
