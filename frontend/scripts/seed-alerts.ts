/**
 * Pre-populate the `alerts` collection with mock detections so the dashboard
 * boots non-empty. Picks one suspicious event per employee for variety and
 * runs them through the same `runDetection()` seam that the API uses.
 *
 *   $ npm run seed-alerts
 *   $ npm run seed-alerts -- --limit 200      # cap the run
 *   $ npm run seed-alerts -- --reset          # drop existing alerts first
 */
import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || "PRISM";
if (!URI) throw new Error("MONGODB_URI is not set; copy .env.local from the worktree.");

import { runDetection } from "../lib/detect";
import type { Alert, ActivityLog, Transaction, Employee } from "../lib/db/schemas";

async function main() {
  const args = process.argv.slice(2);
  const limit = Number(args[args.indexOf("--limit") + 1]) || 250;
  const reset = args.includes("--reset");

  const client = new MongoClient(URI!);
  await client.connect();
  const db = client.db(DB);

  if (reset) {
    console.log("Resetting alerts + alert_audit…");
    await db.collection("alerts").deleteMany({});
    await db.collection("alert_audit").deleteMany({});
  }

  console.log("Pulling suspicious events…");
  const tx = await db
    .collection<Transaction>("transactions")
    .find({ is_suspicious: true })
    .sort({ transaction_datetime: -1 })
    .limit(limit)
    .toArray();
  const logs = await db
    .collection<ActivityLog>("activity_logs")
    .find({ is_suspicious: true })
    .sort({ action_datetime: -1 })
    .limit(limit)
    .toArray();

  const seenEmployees = new Set<string>();
  const events: Array<{
    employee_id: string;
    event_type: string;
    metadata: Record<string, unknown>;
    branch_id: string;
    source_id: string;
  }> = [];

  for (const t of tx) {
    if (!t.initiated_by_employee_id || !t.suspicion_type) continue;
    if (seenEmployees.has(t.initiated_by_employee_id)) continue;
    seenEmployees.add(t.initiated_by_employee_id);
    events.push({
      employee_id: t.initiated_by_employee_id,
      event_type: t.suspicion_type,
      metadata: {
        amount_inr: t.amount_inr,
        account_id: t.account_id,
        transaction_type: t.transaction_type,
        transaction_datetime: t.transaction_datetime,
      },
      branch_id: t.branch_id,
      source_id: t.transaction_id,
    });
  }
  for (const l of logs) {
    if (!l.suspicion_type) continue;
    if (seenEmployees.has(l.employee_id)) continue;
    seenEmployees.add(l.employee_id);
    events.push({
      employee_id: l.employee_id,
      event_type: l.suspicion_type,
      metadata: {
        target_entity_id: l.target_entity_id,
        ip_address: l.ip_address,
        device_id: l.device_id,
        action_datetime: l.action_datetime,
      },
      branch_id: l.branch_id,
      source_id: l.log_id,
    });
  }

  console.log(`Running detection on ${events.length} candidate employees…`);

  const empCol = db.collection<Employee>("employees");
  const alertsCol = db.collection<Alert>("alerts");

  let written = 0;
  for (const ev of events) {
    const result = await runDetection({
      employee_id: ev.employee_id,
      event_type: ev.event_type,
      event_metadata: ev.metadata,
      source_event_ids: [ev.source_id],
    });

    const emp = await empCol.findOne(
      { employee_id: ev.employee_id },
      { projection: { full_name: 1, branch_id: 1 } },
    );

    const alert: Alert = {
      alert_id: `ALERT_SEED_${written}_${Math.random().toString(36).slice(2, 8)}`,
      employee_id: ev.employee_id,
      employee_name: emp?.full_name,
      branch_id: emp?.branch_id || ev.branch_id,
      event_type: ev.event_type,
      event_metadata: ev.metadata,
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
      source_event_ids: [ev.source_id],
      detector_version: result.detector_version,
    };
    await alertsCol.insertOne(alert);
    written += 1;
    if (written % 25 === 0) console.log(`  ${written}/${events.length}`);
  }

  const counts = await alertsCol
    .aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }])
    .toArray();
  console.log("Done.");
  for (const r of counts) console.log(`  ${r._id}: ${r.count}`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
