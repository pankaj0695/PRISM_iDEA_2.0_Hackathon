"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Globe } from "lucide-react";
import clsx from "clsx";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/locales";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const current = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function change(loc: Locale) {
    if (loc === current) {
      setOpen(false);
      return;
    }
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: loc }),
      credentials: "include",
    });
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const meta = LOCALE_META[current];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15",
          pending && "opacity-60",
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        {compact ? meta.code.toUpperCase() : meta.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-lg border border-black/10 bg-white text-[var(--fg)] shadow-xl">
            <div className="bg-[var(--ub-blue)]/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ub-blue)]">
              Choose your language
            </div>
            <ul className="max-h-80 overflow-auto py-1">
              {LOCALES.map((l) => {
                const m = LOCALE_META[l];
                const active = l === current;
                return (
                  <li key={l}>
                    <button
                      type="button"
                      onClick={() => change(l)}
                      className={clsx(
                        "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-[var(--ub-blue-50)]",
                        active && "bg-[var(--ub-blue-50)] font-semibold",
                      )}
                    >
                      <span>
                        <span className="text-[var(--fg)]">{m.label}</span>
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                          {m.english}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 text-[var(--ub-blue)]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
