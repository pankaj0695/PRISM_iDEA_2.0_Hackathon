import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { forbidden, notFound, ok, serverError } from "@/lib/api/respond";
import type { Account } from "@/lib/db/schemas";

export const GET = withAuth(async (_req, { user, params }) => {
  try {
    const col = await getCollection<Account>(COLLECTIONS.accounts);
    const doc = await col.findOne({ account_id: params.id });
    if (!doc) return notFound();
    if (user.role === "BRANCH_MANAGER" && doc.branch_id !== user.branch_id) return forbidden();
    if (user.role === "EMPLOYEE" && !(doc.holder_type === "EMPLOYEE" && doc.holder_id === user.sub))
      return forbidden();
    return ok(doc);
  } catch (e) {
    return serverError(e);
  }
});
