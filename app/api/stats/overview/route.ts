import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getDb } from "@/lib/db/mongo";
import { ok, serverError } from "@/lib/api/respond";

export const GET = withAuth(async (_req, { user }) => {
  try {
    const db = await getDb();
    const branchFilter: Record<string, string> =
      user.role === "BRANCH_MANAGER" ? { branch_id: user.branch_id } : {};

    const col = (name: string) => db.collection(name);

    const [
      branches,
      employees,
      customers,
      accounts,
      transactions,
      activityLogs,
      dependents,
      alerts,
      criticalAlerts,
      suspiciousTx,
      suspiciousLogs,
      dormantAccounts,
    ] = await Promise.all([
      col(COLLECTIONS.branches).countDocuments(),
      col(COLLECTIONS.employees).countDocuments(branchFilter),
      col(COLLECTIONS.customers).countDocuments(branchFilter),
      col(COLLECTIONS.accounts).countDocuments(branchFilter),
      col(COLLECTIONS.transactions).countDocuments(branchFilter),
      col(COLLECTIONS.activity_logs).countDocuments(branchFilter),
      col(COLLECTIONS.dependents).countDocuments(),
      col(COLLECTIONS.alerts).countDocuments(branchFilter),
      col(COLLECTIONS.alerts).countDocuments({ ...branchFilter, severity: "CRITICAL" }),
      col(COLLECTIONS.transactions).countDocuments({ ...branchFilter, is_suspicious: true }),
      col(COLLECTIONS.activity_logs).countDocuments({ ...branchFilter, is_suspicious: true }),
      col(COLLECTIONS.accounts).countDocuments({ ...branchFilter, status: "DORMANT" }),
    ]);

    const severityAgg = await col(COLLECTIONS.alerts)
      .aggregate([
        { $match: branchFilter },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ])
      .toArray();
    const bySeverity: Record<string, number> = { CRITICAL: 0, HIGH: 0, WATCH: 0, CLEAR: 0 };
    for (const row of severityAgg) bySeverity[row._id as string] = row.count;

    return ok({
      collections: {
        branches,
        employees,
        customers,
        accounts,
        transactions,
        activity_logs: activityLogs,
        dependents,
      },
      alerts: { total: alerts, critical: criticalAlerts, by_severity: bySeverity },
      suspicious: { transactions: suspiciousTx, activity_logs: suspiciousLogs },
      accounts_dormant: dormantAccounts,
      scope: user.role === "BRANCH_MANAGER" ? { branch_id: user.branch_id } : { all: true },
    });
  } catch (e) {
    return serverError(e);
  }
});
