import { z } from "zod";
import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { ok, parseBody, serverError } from "@/lib/api/respond";
import type { Disclosure } from "@/lib/db/schemas";

const Body = z.object({
  external_bank_name: z.string().min(1).max(120),
  external_account_number: z.string().min(4).max(40),
  ifsc_code: z.string().max(20).optional(),
  account_holder_relationship: z.string().min(1).max(80),
  declared_balance_inr: z.number().min(0).optional(),
  reason: z.string().min(1).max(1000),
});

export const POST = withAuth(async (req, { user }) => {
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.response;
  try {
    const col = await getCollection<Disclosure>(COLLECTIONS.disclosures);
    const disclosure: Disclosure = {
      disclosure_id: `DSC_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      employee_id: user.sub,
      submitted_at: new Date().toISOString(),
      status: "SUBMITTED",
      ...parsed.data,
    };
    await col.insertOne(disclosure);
    return ok(disclosure, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
});

export const GET = withAuth(async (_req, { user }) => {
  try {
    const col = await getCollection<Disclosure>(COLLECTIONS.disclosures);
    const items = await col.find({ employee_id: user.sub }).sort({ submitted_at: -1 }).toArray();
    return ok({ items });
  } catch (e) {
    return serverError(e);
  }
});
