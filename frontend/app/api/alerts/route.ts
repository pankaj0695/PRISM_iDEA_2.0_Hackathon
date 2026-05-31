import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { ok, serverError } from "@/lib/api/respond";
import type { Alert } from "@/lib/db/schemas";
import { PAGINATION_QUERY } from "@/lib/api/respond";
import type { Filter } from "mongodb";

export const GET = withAuth(async (req, { user }) => {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const { page, limit, skip } = PAGINATION_QUERY.parsePage(sp);

    const filter: Filter<Alert> = {};
    const severity = sp.get("severity");
    const status = sp.get("status");
    const employee = sp.get("employee_id");
    if (severity) filter.severity = severity as Alert["severity"];
    if (status) filter.status = status as Alert["status"];
    if (employee) filter.employee_id = employee;

    if (user.role === "BRANCH_MANAGER") filter.branch_id = user.branch_id;
    if (user.role === "EMPLOYEE") filter.employee_id = user.sub;

    const col = await getCollection<Alert>(COLLECTIONS.alerts);
    const [items, total] = await Promise.all([
      col.find(filter).sort({ triggered_at: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);
    return ok({ items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    return serverError(e);
  }
});
