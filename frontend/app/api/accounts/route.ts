import { withAuth } from "@/lib/auth/withAuth";
import { listRoute, pickStringFilter } from "@/lib/api/list";
import { COLLECTIONS } from "@/lib/db/mongo";
import type { Account } from "@/lib/db/schemas";

const handler = listRoute<Account>({
  collection: COLLECTIONS.accounts,
  sort: { account_id: 1 },
  filterFromQuery: (sp) => ({
    ...pickStringFilter(sp, "branch_id", "branch_id"),
    ...pickStringFilter(sp, "status", "status"),
    ...pickStringFilter(sp, "holder_type", "holder_type"),
    ...pickStringFilter(sp, "holder_id", "holder_id"),
    ...pickStringFilter(sp, "account_type", "account_type"),
  }),
  scope: (user) => {
    if (user.role === "BRANCH_MANAGER") return { branch_id: user.branch_id };
    if (user.role === "EMPLOYEE") return { holder_type: "EMPLOYEE", holder_id: user.sub };
    return {};
  },
});

export const GET = withAuth(async (req, { user }) => handler(req, user));
