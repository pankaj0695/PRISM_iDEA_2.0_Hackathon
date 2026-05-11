import { withAuth } from "@/lib/auth/withAuth";
import { listRoute, pickStringFilter, pickBoolFilter } from "@/lib/api/list";
import { COLLECTIONS } from "@/lib/db/mongo";
import type { Customer } from "@/lib/db/schemas";

const handler = listRoute<Customer>({
  collection: COLLECTIONS.customers,
  sort: { customer_id: 1 },
  projection: { pan_number: 0, aadhar_last4: 0 },
  filterFromQuery: (sp) => {
    const q = sp.get("q");
    const f: Record<string, unknown> = {};
    Object.assign(f,
      pickStringFilter(sp, "branch_id", "branch_id"),
      pickStringFilter(sp, "risk_category", "risk_category"),
      pickStringFilter(sp, "kyc_status", "kyc_status"),
      pickBoolFilter(sp, "is_vip_customer", "is_vip_customer"),
      pickBoolFilter(sp, "is_politically_exposed", "is_politically_exposed"),
    );
    if (q) {
      f.$or = [
        { full_name: { $regex: q, $options: "i" } },
        { customer_id: { $regex: q, $options: "i" } },
        { mobile_number: { $regex: q, $options: "i" } },
      ];
    }
    return f as Record<string, never>;
  },
  scope: (user) => {
    if (user.role === "BRANCH_MANAGER") return { branch_id: user.branch_id };
    return {};
  },
});

export const GET = withAuth(async (req, { user }) => handler(req, user));
