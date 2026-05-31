import { withAuth } from "@/lib/auth/withAuth";
import { listRoute, pickBoolFilter, pickDateRangeFilter, pickStringFilter } from "@/lib/api/list";
import { COLLECTIONS } from "@/lib/db/mongo";
import type { ActivityLog } from "@/lib/db/schemas";

const handler = listRoute<ActivityLog>({
  collection: COLLECTIONS.activity_logs,
  sort: { action_datetime: -1 },
  filterFromQuery: (sp) => ({
    ...pickStringFilter(sp, "branch_id", "branch_id"),
    ...pickStringFilter(sp, "employee_id", "employee_id"),
    ...pickStringFilter(sp, "action_type", "action_type"),
    ...pickStringFilter(sp, "session_id", "session_id"),
    ...pickStringFilter(sp, "suspicion_type", "suspicion_type"),
    ...pickBoolFilter(sp, "is_suspicious", "is_suspicious"),
    ...pickDateRangeFilter(sp, "from", "to", "action_datetime"),
  }),
  scope: (user) => {
    if (user.role === "BRANCH_MANAGER") return { branch_id: user.branch_id };
    if (user.role === "EMPLOYEE") return { employee_id: user.sub };
    return {};
  },
});

export const GET = withAuth(async (req, { user }) => handler(req, user));
