"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { SeverityBadge } from "@/components/ub/SeverityBadge";
import type { Alert } from "@/lib/db/schemas";

interface ListResponse {
  items: Alert[];
  total: number;
  page: number;
  pages: number;
}

export function AlertList({ basePath, severity }: { basePath: string; severity?: string }) {
  const [live, setLive] = useState<Alert[]>([]);
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
    return <div className="text-sm text-[var(--fg-muted)]">Loading alerts…</div>;

  if (merged.length === 0)
    return (
      <div className="rounded-md border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-[var(--fg-muted)]">
        No alerts yet — run <code className="font-mono">npm run seed-alerts</code> to populate the demo feed.
      </div>
    );

  return (
    <ol className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)] bg-white">
      {merged.map((a) => (
        <li key={a.alert_id}>
          <Link
            href={`${basePath}/${a.alert_id}`}
            className="flex flex-wrap items-center gap-3 px-3 py-3 hover:bg-[var(--ub-blue-50)]"
          >
            <SeverityBadge severity={a.severity} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--fg)]">
                {a.event_type.replace(/_/g, " ")} · {a.employee_name || a.employee_id}
              </div>
              <div className="truncate text-xs text-[var(--fg-muted)]">{a.causal_chain_text}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold tabular-nums text-[var(--fg)]">
                Risk {Math.round(a.risk_score * 100)}
              </div>
              <div className="text-[11px] text-[var(--fg-muted)]">
                {formatDistanceToNow(new Date(a.triggered_at), { addSuffix: true })}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
