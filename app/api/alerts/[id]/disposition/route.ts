import { z } from "zod";
import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { publish } from "@/lib/realtime/sse";
import { bad, forbidden, notFound, ok, parseBody, serverError } from "@/lib/api/respond";
import { can } from "@/lib/auth/rbac";
import type { Alert, AlertAuditEntry, AlertStatus } from "@/lib/db/schemas";

const Body = z.object({
  decision: z.enum(["CONFIRM_FRAUD", "DISMISS", "ESCALATE", "FREEZE_ACCOUNT", "INVESTIGATING"]),
  notes: z.string().max(2000).optional(),
});

const DECISION_TO_STATUS: Record<z.infer<typeof Body>["decision"], AlertStatus> = {
  CONFIRM_FRAUD: "CONFIRMED_FRAUD",
  DISMISS: "DISMISSED",
  ESCALATE: "ESCALATED",
  FREEZE_ACCOUNT: "INVESTIGATING",
  INVESTIGATING: "INVESTIGATING",
};

export const POST = withAuth(async (req, { user, params }) => {
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.response;
  const { decision, notes } = parsed.data;

  // Capability checks per the doc Section 8 matrix.
  if (decision === "CONFIRM_FRAUD" && !can(user.role, "alerts.confirm")) return forbidden();
  if (decision === "DISMISS" && !can(user.role, "alerts.dismiss")) return forbidden();
  if (decision === "ESCALATE" && !can(user.role, "alerts.escalate")) return forbidden();
  if (decision === "FREEZE_ACCOUNT" && !(can(user.role, "accounts.freeze") || can(user.role, "accounts.freeze.recommend")))
    return forbidden();

  try {
    const alertsCol = await getCollection<Alert>(COLLECTIONS.alerts);
    const auditCol = await getCollection<AlertAuditEntry>(COLLECTIONS.alert_audit);

    const before = await alertsCol.findOne({ alert_id: params.id });
    if (!before) return notFound();
    if (user.role === "BRANCH_MANAGER" && before.branch_id !== user.branch_id) return forbidden();

    const status = DECISION_TO_STATUS[decision];
    const disposition: Alert["disposition"] = {
      decision: decision === "FREEZE_ACCOUNT" && user.role === "BRANCH_MANAGER" ? "FREEZE_RECOMMENDED" : decision,
      notes,
      decided_by: user.sub,
      decided_at: new Date().toISOString(),
    };

    const after = { ...before, status, disposition };
    await alertsCol.updateOne(
      { alert_id: params.id },
      { $set: { status, disposition } },
    );
    await auditCol.insertOne({
      audit_id: `AUD_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      alert_id: params.id,
      actor_employee_id: user.sub,
      actor_role: user.role,
      action: `DISPOSITION:${disposition.decision}`,
      before,
      after,
      notes,
      at: new Date().toISOString(),
    });
    publish({ type: "alert.updated", alert: after });
    return ok({ alert: after });
  } catch (e) {
    return serverError(e);
  }
});
