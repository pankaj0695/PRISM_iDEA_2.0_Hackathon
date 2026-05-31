import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { forbidden, notFound, ok, serverError } from "@/lib/api/respond";
import type { Customer } from "@/lib/db/schemas";

export const GET = withAuth(async (_req, { user, params }) => {
  try {
    const col = await getCollection<Customer>(COLLECTIONS.customers);
    const doc = await col.findOne(
      { customer_id: params.id },
      { projection: { pan_number: 0, aadhar_last4: 0 } },
    );
    if (!doc) return notFound();
    if (user.role === "BRANCH_MANAGER" && doc.branch_id !== user.branch_id) return forbidden();
    return ok(doc);
  } catch (e) {
    return serverError(e);
  }
});
