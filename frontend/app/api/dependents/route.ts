import { withAuth } from "@/lib/auth/withAuth";
import { listRoute, pickStringFilter } from "@/lib/api/list";
import { COLLECTIONS } from "@/lib/db/mongo";
import type { Dependent } from "@/lib/db/schemas";

const handler = listRoute<Dependent>({
  collection: COLLECTIONS.dependents,
  sort: { dependent_id: 1 },
  projection: { pan_number: 0, aadhar_last4: 0 },
  filterFromQuery: (sp) => ({
    ...pickStringFilter(sp, "employee_id", "employee_id"),
    ...pickStringFilter(sp, "relationship", "relationship"),
  }),
  scope: (user) => {
    if (user.role === "EMPLOYEE") return { employee_id: user.sub };
    return {};
  },
});

export const GET = withAuth(async (req, { user }) => handler(req, user));
