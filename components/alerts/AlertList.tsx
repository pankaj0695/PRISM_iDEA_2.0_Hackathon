"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";
import { SeverityBadge } from "@/components/ub/SeverityBadge";
import type { Alert } from "@/lib/db/schemas";

interface ListResponse {
  items: Alert[];
  total: number;
  page: number;
  pages: number;
}

export function AlertList({ basePath, severity }: { basePath: string; severity?: string }) {
  const t = useTranslations();
  const [live, setLive] = useState<Alert[]>([]);
  const newRef = useRef<Set<string>>(new Set());

  const params = new URLSearchParams();
  if (severity) params.set("severity", severity);
  params.set("limit", "30");

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["alerts", severity || "all"],
    queryFn: async () => {
      const r = await fetch(`/api/alerts?${params.toString()}`, { credentials: "include" });
      return r.json();
    },
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const es = new EventSource("/api/realtime", { withCredentials: true });
    es.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data) as { type: string; alert?: Alert };
        if (ev.type === "alert.new" && ev.alert) {
          newRef.current.add(ev.alert.alert_id);
          setLive((prev) => [ev.alert!, ...prev].slice(0, 20));
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const out: Alert[] = [];
    for (const a of [...live, ...(data?.items || [])]) {
      if (seen.has(a.alert_id)) continue;
      seen.add(a.alert_id);
      out.push(a);
    }
    return out;
  }, [live, data]);

  if (isLoading && merged.length === 0)
    return <div className="text-sm text-[var(--fg-muted)]">{t("common.loading")}</div>;

  if (merged.length === 0)
    return (
      <div className="rounded-md border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-[var(--fg-muted)]">
        {t("feed.empty")}
      </div>
    );

  return (
    <ol className="ub-card divide-y divide-[var(--border)] overflow-hidden p-0">
      {merged.map((a) => {
        const isNew = newRef.current.has(a.alert_id);
        return (
          <li key={a.alert_id} className={clsx(isNew && "ub-anim-in")}>
            <Link
              href={`${basePath}/${a.alert_id}`}
              className="group flex flex-wrap items-center gap-3 px-3 py-3 transition hover:bg-[var(--ub-blue-50)]"
            >
              <SeverityBadge severity={a.severity} pulse={a.severity === "CRITICAL"} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--fg)]">
                  {a.event_type.replace(/_/g, " ")}
                  <span className="ml-2 font-normal text-[var(--fg-muted)]">
                    · {a.employee_name || a.employee_id}
                  </span>
                </div>
                <div className="truncate text-xs text-[var(--fg-muted)]">
                  {a.causal_chain_text}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold tabular-nums text-[var(--fg)]">
                  {t("alert.riskScore")}: {Math.round(a.risk_score * 100)}
                </div>
                <div className="text-[11px] text-[var(--fg-muted)]">
                  {formatDistanceToNow(new Date(a.triggered_at), { addSuffix: true })}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--border-strong)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ub-blue)]" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
