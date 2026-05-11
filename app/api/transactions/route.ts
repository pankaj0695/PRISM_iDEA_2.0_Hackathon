import { withAuth } from "@/lib/auth/withAuth";
import { listRoute, pickBoolFilter, pickDateRangeFilter, pickStringFilter } from "@/lib/api/list";
import { COLLECTIONS } from "@/lib/db/mongo";
import type { Transaction } from "@/lib/db/schemas";

const handler = listRoute<Transaction>({
  collection: COLLECTIONS.transactions,
  sort: { transaction_datetime: -1 },
  filterFromQuery: (sp) => ({
    ...pickStringFilter(sp, "branch_id", "branch_id"),
    ...pickStringFilter(sp, "account_id", "account_id"),
    ...pickStringFilter(sp, "transaction_type", "transaction_type"),
    ...pickStringFilter(sp, "channel", "channel"),
    ...pickStringFilter(sp, "initiated_by_employee_id", "initiated_by_employee_id"),
    ...pickStringFilter(sp, "suspicion_type", "suspicion_type"),
    ...pickBoolFilter(sp, "is_suspicious", "is_suspicious"),
    ...pickDateRangeFilter(sp, "from", "to", "transaction_datetime"),
  }),
  scope: (user) => {
    if (user.role === "BRANCH_MANAGER") return { branch_id: user.branch_id };
    if (user.role === "EMPLOYEE") return { initiated_by_employee_id: user.sub };
    return {};
  },
});

export const GET = withAuth(async (req, { user }) => handler(req, user));
