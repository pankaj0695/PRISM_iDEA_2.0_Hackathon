import { z } from "zod";
import { withAuth } from "@/lib/auth/withAuth";
import { parseBody, ok, serverError, forbidden } from "@/lib/api/respond";
import { runDetection } from "@/lib/detect";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { publish } from "@/lib/realtime/sse";
import type { Alert, Employee } from "@/lib/db/schemas";

const Body = z.object({
  employee_id: z.string().min(1),
  event_type: z.string().min(1),
  event_metadata: z.record(z.string(), z.unknown()).optional(),
  source_event_ids: z.array(z.string()).optional(),
});

export const POST = withAuth(async (req, { user }) => {
  if (!["ADMIN", "FRAUD_ANALYST", "COMPLIANCE_OFFICER"].includes(user.role)) return forbidden();
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await runDetection(parsed.data);

    const employees = await getCollection<Employee>(COLLECTIONS.employees);
    const emp = await employees.findOne(
      { employee_id: parsed.data.employee_id },
      { projection: { full_name: 1, branch_id: 1 } },
    );

    const alert: Alert = {
      alert_id: `ALERT_${Date.now()}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      employee_id: result.employee_id,
      employee_name: emp?.full_name,
      branch_id: emp?.branch_id || "?",
      event_type: parsed.data.event_type,
      event_metadata: parsed.data.event_metadata,
      triggered_at: result.triggered_at,
      severity: result.severity,
      risk_score: result.risk_score,
      layer1: result.layer1,
      layer2: result.layer2,
      fused_belief: result.fused_belief,
      causal_chain: result.causal_chain,
      causal_chain_text: result.causal_chain_text,
      chain_probability: result.chain_probability,
      status: "OPEN",
      source_event_ids: result.source_event_ids,
      detector_version: result.detector_version,
    };

    const alertsCol = await getCollection<Alert>(COLLECTIONS.alerts);
    await alertsCol.insertOne(alert);

    publish({ type: "alert.new", alert });

    return ok({ result, alert });
  } catch (e) {
    return serverError(e);
  }
});
