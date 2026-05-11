import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { ok, serverError } from "@/lib/api/respond";
import type { Alert } from "@/lib/db/schemas";

export const GET = withAuth(async (_req, { user }) => {
  try {
    const match: Record<string, unknown> = {};
    if (user.role === "BRANCH_MANAGER") match.branch_id = user.branch_id;

    const col = await getCollection<Alert>(COLLECTIONS.alerts);
    const rows = await col
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              date: { $substr: ["$triggered_at", 0, 10] },
              severity: "$severity",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ])
      .toArray();

    type TrendRow = { date: string; CRITICAL: number; HIGH: number; WATCH: number; CLEAR: number };
    const byDate = new Map<string, TrendRow>();
    type SevKey = "CRITICAL" | "HIGH" | "WATCH" | "CLEAR";
    for (const r of rows) {
      const d = r._id.date as string;
      const sev = r._id.severity as SevKey;
      const cur: TrendRow = byDate.get(d) || { date: d, CRITICAL: 0, HIGH: 0, WATCH: 0, CLEAR: 0 };
      cur[sev] = r.count;
      byDate.set(d, cur);
    }
    return ok({ series: Array.from(byDate.values()) });
  } catch (e) {
    return serverError(e);
  }
});
