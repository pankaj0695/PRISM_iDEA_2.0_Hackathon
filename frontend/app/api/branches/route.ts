import { withAuth } from "@/lib/auth/withAuth";
import { listRoute, pickStringFilter } from "@/lib/api/list";
import { COLLECTIONS } from "@/lib/db/mongo";
import type { Branch } from "@/lib/db/schemas";

const handler = listRoute<Branch>({
  collection: COLLECTIONS.branches,
  sort: { branch_id: 1 },
  filterFromQuery: (sp) => ({
    ...pickStringFilter(sp, "city", "city"),
    ...pickStringFilter(sp, "state", "state"),
    ...pickStringFilter(sp, "region", "region"),
  }),
  scope: (user) => {
    // Managers see only their branch in list mode.
    if (user.role === "BRANCH_MANAGER") return { branch_id: user.branch_id };
    return {};
  },
});

export const GET = withAuth(async (req, { user }) => handler(req, user));
