import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { forbidden, notFound, ok, serverError } from "@/lib/api/respond";
import type { Employee } from "@/lib/db/schemas";

export const GET = withAuth(async (_req, { user, params }) => {
  try {
    const col = await getCollection<Employee>(COLLECTIONS.employees);
    const doc = await col.findOne(
      { employee_id: params.id },
      { projection: { pan_number: 0, biometric_id: 0 } },
    );
    if (!doc) return notFound("Employee not found");
    if (user.role === "EMPLOYEE" && doc.employee_id !== user.sub) return forbidden();
    if (user.role === "BRANCH_MANAGER" && doc.branch_id !== user.branch_id) return forbidden();
    return ok(doc);
  } catch (e) {
    return serverError(e);
  }
});
