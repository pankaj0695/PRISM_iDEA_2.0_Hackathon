"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface TrendPoint {
  date: string;
  CRITICAL: number;
  HIGH: number;
  WATCH: number;
  CLEAR: number;
}

export function SeverityTrend() {
  const { data, isLoading } = useQuery<{ series: TrendPoint[] }>({
    queryKey: ["severity-trend"],
    queryFn: async () => {
      const r = await fetch("/api/stats/severity-trend", { credentials: "include" });
      return r.json();
    },
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="text-sm text-[var(--fg-muted)]">Loading…</div>;
  if (!data?.series?.length)
    return (
      <div className="rounded-md border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-[var(--fg-muted)]">
        No alert history yet.
      </div>
    );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data.series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#475569" fontSize={11} />
          <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="CRITICAL" stackId="1" stroke="#b91c1c" fill="#b91c1c" />
          <Area type="monotone" dataKey="HIGH" stackId="1" stroke="#ea580c" fill="#ea580c" />
          <Area type="monotone" dataKey="WATCH" stackId="1" stroke="#ca8a04" fill="#ca8a04" />
          <Area type="monotone" dataKey="CLEAR" stackId="1" stroke="#15803d" fill="#15803d" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
