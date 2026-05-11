import { withAuth } from "@/lib/auth/withAuth";
import { listRoute, pickStringFilter } from "@/lib/api/list";
import { COLLECTIONS } from "@/lib/db/mongo";
import type { Employee } from "@/lib/db/schemas";

const handler = listRoute<Employee>({
  collection: COLLECTIONS.employees,
  sort: { employee_id: 1 },
  projection: {
    pan_number: 0,
    biometric_id: 0,
  },
  filterFromQuery: (sp) => {
    const q = sp.get("q");
    const filter: Record<string, unknown> = {};
    Object.assign(filter,
      pickStringFilter(sp, "branch_id", "branch_id"),
      pickStringFilter(sp, "grade", "grade"),
      pickStringFilter(sp, "role_category", "role_category"),
      pickStringFilter(sp, "status", "status"),
    );
    if (q) {
      filter.$or = [
        { full_name: { $regex: q, $options: "i" } },
        { employee_code: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
    return filter as Record<string, never>;
  },
  scope: (user) => {
    if (user.role === "BRANCH_MANAGER") return { branch_id: user.branch_id };
    if (user.role === "EMPLOYEE") return { employee_id: user.sub };
    return {};
  },
});

export const GET = withAuth(async (req, { user }) => handler(req, user));
