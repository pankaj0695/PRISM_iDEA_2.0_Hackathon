import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { forbidden, notFound, ok, serverError } from "@/lib/api/respond";
import type { Alert, Branch, Employee } from "@/lib/db/schemas";

export const GET = withAuth(async (_req, { user, params }) => {
  try {
    const col = await getCollection<Alert>(COLLECTIONS.alerts);
    const alert = await col.findOne({ alert_id: params.id });
    if (!alert) return notFound();
    if (user.role === "BRANCH_MANAGER" && alert.branch_id !== user.branch_id) return forbidden();
    if (user.role === "EMPLOYEE" && alert.employee_id !== user.sub) return forbidden();

    const emps = await getCollection<Employee>(COLLECTIONS.employees);
    const brs = await getCollection<Branch>(COLLECTIONS.branches);
    const [employee, branch] = await Promise.all([
      emps.findOne(
        { employee_id: alert.employee_id },
        { projection: { full_name: 1, employee_code: 1, designation: 1, grade: 1, role_category: 1, branch_id: 1 } },
      ),
      brs.findOne({ branch_id: alert.branch_id }, { projection: { branch_name: 1, city: 1, state: 1, ifsc_code: 1 } }),
    ]);
    return ok({ alert, employee, branch });
  } catch (e) {
    return serverError(e);
  }
});
