import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { notFound, ok, serverError } from "@/lib/api/respond";
import type { Branch } from "@/lib/db/schemas";

export const GET = withAuth(async (_req, { params }) => {
  try {
    const col = await getCollection<Branch>(COLLECTIONS.branches);
    const doc = await col.findOne({ branch_id: params.id });
    if (!doc) return notFound("Branch not found");
    return ok(doc);
  } catch (e) {
    return serverError(e);
  }
});
