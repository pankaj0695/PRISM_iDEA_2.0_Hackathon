import { z } from "zod";
import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { parseBody, ok, serverError, bad } from "@/lib/api/respond";
import { runDetection } from "@/lib/detect";
import { mockDetector } from "@/lib/detect/mockDetector";
import { publish } from "@/lib/realtime/sse";
import { classifyOperation } from "@/lib/operations/classify";
import type { OperationAction, OperationRequest } from "@/lib/operations/types";
import type { Account, ActivityLog, Alert, Employee, Transaction } from "@/lib/db/schemas";

const ACTIONS: OperationAction[] = [
  "TRANSACTION_INITIATE",
  "FD_BREAK",
  "ACCOUNT_VIEW",
  "BULK_ACCOUNT_ACCESS",
  "BULK_DATA_EXPORT",
  "OVERRIDE_LIMIT",
  "CONFIG_CHANGE",
];

const Body = z.object({
  action: z.enum(ACTIONS as unknown as [OperationAction, ...OperationAction[]]),
  account_id: z.string().optional(),
  customer_id: z.string().optional(),
  amount_inr: z.number().nonnegative().optional(),
  transaction_type: z.string().optional(),
  narration: z.string().max(500).optional(),
  channel: z.string().optional(),
  record_count: z.number().int().nonnegative().optional(),
  account_ids: z.array(z.string()).optional(),
  pretend_now: z.string().datetime().optional(),
});

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function pickClientFingerprint(req: Request) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = (fwd.split(",")[0] || "").trim() || "127.0.0.1";
  const ua = req.headers.get("user-agent") || "unknown";
  const device = `WEB_${Buffer.from(ua).toString("base64").slice(0, 10)}`;
  return { ip, device };
}

export const POST = withAuth(async (req, { user }) => {
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.data as OperationRequest;

  try {
    const employees = await getCollection<Employee>(COLLECTIONS.employees);
    const accounts = await getCollection<Account>(COLLECTIONS.accounts);
    const logsCol = await getCollection<ActivityLog>(COLLECTIONS.activity_logs);
    const txCol = await getCollection<Transaction>(COLLECTIONS.transactions);
    const alertsCol = await getCollection<Alert>(COLLECTIONS.alerts);

    const employee = await employees.findOne({ employee_id: user.sub });
    if (!employee) return bad("Employee record missing for current session");

    const account = payload.account_id
      ? await accounts.findOne({ account_id: payload.account_id })
      : null;

    const now = payload.pretend_now ? new Date(payload.pretend_now) : new Date();
    const fingerprint = pickClientFingerprint(req);

    const classification = classifyOperation({
      request: payload,
      employee,
      account,
      now,
    });

    // 1. Persist an ActivityLog entry for every operation.
    const log: ActivityLog = {
      log_id: newId("LOG"),
      session_id: newId("SES"),
      employee_id: employee.employee_id,
      branch_id: employee.branch_id,
      action_type: payload.action,
      target_entity_type: payload.account_id
        ? "ACCOUNT"
        : payload.customer_id
          ? "CUSTOMER"
          : "SYSTEM",
      target_entity_id: payload.account_id || payload.customer_id || "—",
      ip_address: fingerprint.ip,
      device_id: fingerprint.device,
      action_datetime: now.toISOString(),
      action_date: now.toISOString().slice(0, 10),
      action_time: now.toISOString().slice(11, 19),
      status: classification.suspicious ? "FLAGGED" : "SUCCESS",
      is_suspicious: classification.suspicious,
      suspicion_type: classification.suspicion_type,
      metadata: {
        amount_inr: payload.amount_inr,
        record_count: payload.record_count,
        account_ids: payload.account_ids,
        narration: payload.narration,
        reasons: classification.reasons,
      },
      created_at: now.toISOString(),
    };
    await logsCol.insertOne(log);

    // 2. Persist a Transaction when the operation models a money movement.
    let transaction: Transaction | null = null;
    if (classification.emits_transaction && account) {
      transaction = {
        transaction_id: newId("TXN"),
        account_id: account.account_id,
        account_number: account.account_number,
        holder_type: account.holder_type,
        holder_id: account.holder_id,
        branch_id: account.branch_id,
        transaction_type:
          payload.transaction_type ||
          (payload.action === "FD_BREAK" ? "FD_PREMATURE_BREAK" : "NEFT"),
        debit_credit: "DEBIT",
        amount_inr: payload.amount_inr ?? 0,
        channel: payload.channel || "BRANCH",
        initiated_by_employee_id: employee.employee_id,
        transaction_datetime: now.toISOString(),
        transaction_date: now.toISOString().slice(0, 10),
        transaction_time: now.toISOString().slice(11, 19),
        narration: payload.narration || `${payload.action} by ${employee.full_name}`,
        reference_number: newId("REF"),
        counterparty_account: null,
        counterparty_name: null,
        status: classification.suspicious ? "FLAGGED" : "POSTED",
        is_suspicious: classification.suspicious,
        suspicion_type: classification.suspicion_type,
        created_at: now.toISOString(),
      };
      await txCol.insertOne(transaction);
    }

    // 3. If suspicious, run the detector and publish an alert.
    let alert: Alert | null = null;
    if (classification.suspicious && classification.suspicion_type) {
      const detectionReq = {
        employee_id: employee.employee_id,
        event_type: classification.suspicion_type,
        event_metadata: {
          ...payload,
          reasons: classification.reasons,
        },
        source_event_ids: [
          log.log_id,
          ...(transaction ? [transaction.transaction_id] : []),
        ],
      };
      let detection;
      try {
        detection = await runDetection(detectionReq);
      } catch (e) {
        console.warn("[operations] primary detector failed, falling back to mock:", (e as Error).message);
        detection = await mockDetector.run(detectionReq);
      }
      alert = {
        alert_id: newId("ALERT"),
        employee_id: employee.employee_id,
        employee_name: employee.full_name,
        branch_id: employee.branch_id,
        event_type: classification.suspicion_type,
        event_metadata: { ...payload, reasons: classification.reasons },
        triggered_at: detection.triggered_at,
        severity: detection.severity,
        risk_score: detection.risk_score,
        layer1: detection.layer1,
        layer2: detection.layer2,
        fused_belief: detection.fused_belief,
        causal_chain: detection.causal_chain,
        causal_chain_text: detection.causal_chain_text,
        chain_probability: detection.chain_probability,
        status: "OPEN",
        source_event_ids: detection.source_event_ids,
        detector_version: detection.detector_version,
      };
      await alertsCol.insertOne(alert);
      publish({ type: "alert.new", alert });
    }

    return ok({
      ok: true,
      classification,
      log,
      transaction,
      alert,
    });
  } catch (e) {
    return serverError(e);
  }
});
