import { format } from "date-fns";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import type { ActivityLog, CausalStep, Employee, Transaction } from "@/lib/db/schemas";
import type { Detector, DetectionRequest, DetectionResult } from "./types";
import { classifySeverity, dempsterCombine, normalizeMasses } from "./severity";

/**
 * Weight table maps the seeded suspicion_types to layer-attribution + feature labels.
 * When real models replace this stub, the layer attribution comes from SHAP / GAT
 * outputs directly — the *shape* of the result remains identical.
 */
interface SuspicionProfile {
  layer1: number; // 0..1 attribution to graph layer
  layer2: number; // 0..1 attribution to anomaly layer
  severity: number; // base fraud belief 0..1
  feature: string;
  template: (meta: Record<string, unknown>) => string;
}

const SUSPICION_PROFILES: Record<string, SuspicionProfile> = {
  OFF_HOURS_HIGH_VALUE: {
    layer1: 0.25, layer2: 0.85, severity: 0.82,
    feature: "off_hours_high_value",
    template: (m) =>
      `High-value transaction (₹${fmtINR(num(m.amount_inr))}) initiated outside banking hours`,
  },
  DORMANT_ACCOUNT_ACTIVITY: {
    layer1: 0.7, layer2: 0.7, severity: 0.78,
    feature: "dormant_access",
    template: () => `Touched a DORMANT account that hadn't moved in 12+ months`,
  },
  FD_PREMATURE_BREAK: {
    layer1: 0.78, layer2: 0.7, severity: 0.9,
    feature: "fd_premature_break",
    template: (m) =>
      `Broke a Fixed Deposit before maturity (account ${str(m.account_id) || "?"}, ₹${fmtINR(num(m.amount_inr))})`,
  },
  APPROVAL_LIMIT_BREACH: {
    layer1: 0.2, layer2: 0.85, severity: 0.84,
    feature: "approval_breach",
    template: (m) =>
      `Approved a transaction above this employee's authority (₹${fmtINR(num(m.amount_inr))})`,
  },
  COLLUSION_COORDINATED_ACCESS: {
    layer1: 0.95, layer2: 0.4, severity: 0.88,
    feature: "collusion_pattern",
    template: () => `Coordinated multi-employee access pattern detected on shared customer set`,
  },
  BULK_DATA_EXPORT: {
    layer1: 0.3, layer2: 0.9, severity: 0.86,
    feature: "bulk_export",
    template: (m) =>
      `Bulk data export: ${num(m.records_exported) || num(m.rows_returned) || "many"} records pulled in a single session`,
  },
  OFF_HOURS_LOGIN: {
    layer1: 0.15, layer2: 0.7, severity: 0.55,
    feature: "off_hours_login",
    template: (m) => `Logged in at ${str(m.action_time) || "off-hours"}`,
  },
  UNKNOWN_DEVICE_IP: {
    layer1: 0.25, layer2: 0.65, severity: 0.6,
    feature: "unknown_device",
    template: (m) =>
      `Login from an unrecognised device/IP (${str(m.ip_address) || "?"} via ${str(m.device_id) || "?"})`,
  },
  BULK_ACCOUNT_ACCESS: {
    layer1: 0.5, layer2: 0.85, severity: 0.7,
    feature: "bulk_account_access",
    template: () => `Viewed >20 customer accounts in a single session`,
  },
  REPEATED_FAILED_LOGIN: {
    layer1: 0.1, layer2: 0.55, severity: 0.45,
    feature: "failed_login_burst",
    template: () => `Repeated authentication failures in a short window`,
  },
  PRIVILEGE_ESCALATION_ATTEMPT: {
    layer1: 0.35, layer2: 0.9, severity: 0.9,
    feature: "privilege_escalation",
    template: () => `Attempted to access a system-access tier above their grade`,
  },
  CROSS_BRANCH_ACCESS: {
    layer1: 0.85, layer2: 0.4, severity: 0.65,
    feature: "cross_branch_access",
    template: (m) =>
      `Touched account ${str(m.target_entity_id) || "?"} belonging to a different branch`,
  },
};

const DEFAULT_PROFILE: SuspicionProfile = {
  layer1: 0.3,
  layer2: 0.3,
  severity: 0.18,
  feature: "baseline",
  template: () => `Routine activity observed`,
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function fmtINR(n: number): string {
  if (!n) return "0";
  return n.toLocaleString("en-IN");
}

function pickProfile(suspicion_type: string | null | undefined) {
  if (!suspicion_type) return DEFAULT_PROFILE;
  return SUSPICION_PROFILES[suspicion_type] || DEFAULT_PROFILE;
}

/** Deterministically jitter a value by hashing a string into ±range. */
function jitter(seed: string, range = 0.05): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const normalised = (Math.abs(h) % 1000) / 1000; // 0..1
  return (normalised - 0.5) * 2 * range;
}

export const mockDetector: Detector = {
  name: "mock",
  version: "0.1.0",
  async run(req: DetectionRequest): Promise<DetectionResult> {
    const triggered_at = new Date().toISOString();

    // Pull recent context for this employee: last 30 days of logs + transactions.
    const logsCol = await getCollection<ActivityLog>(COLLECTIONS.activity_logs);
    const txCol = await getCollection<Transaction>(COLLECTIONS.transactions);
    const empCol = await getCollection<Employee>(COLLECTIONS.employees);

    const employee = await empCol.findOne({ employee_id: req.employee_id });

    const recentLogs = await logsCol
      .find({ employee_id: req.employee_id })
      .sort({ action_datetime: -1 })
      .limit(30)
      .toArray();
    const recentTx = await txCol
      .find({ initiated_by_employee_id: req.employee_id })
      .sort({ transaction_datetime: -1 })
      .limit(30)
      .toArray();

    const suspiciousLogs = recentLogs.filter((l) => l.is_suspicious && l.suspicion_type);
    const suspiciousTx = recentTx.filter((t) => t.is_suspicious && t.suspicion_type);

    // Inject the incoming event metadata as an additional pseudo-event so what-if works.
    const synthetic =
      req.event_type && SUSPICION_PROFILES[req.event_type]
        ? [{
            suspicion_type: req.event_type,
            action_datetime: triggered_at,
            metadata: req.event_metadata || {},
            action_time: format(new Date(triggered_at), "HH:mm"),
          }]
        : [];

    type SourceRow = {
      suspicion_type: string;
      action_datetime: string;
      metadata: Record<string, unknown>;
      action_time?: string;
    };

    const events: SourceRow[] = [
      ...suspiciousLogs.map((l): SourceRow => ({
        suspicion_type: l.suspicion_type!,
        action_datetime: l.action_datetime,
        action_time: l.action_time,
        metadata: { ...(l.metadata || {}), target_entity_id: l.target_entity_id, ip_address: l.ip_address, device_id: l.device_id },
      })),
      ...suspiciousTx.map((t): SourceRow => ({
        suspicion_type: t.suspicion_type!,
        action_datetime: t.transaction_datetime,
        metadata: {
          amount_inr: t.amount_inr,
          account_id: t.account_id,
          transaction_type: t.transaction_type,
        },
      })),
      ...synthetic,
    ];

    // Aggregate to belief masses per layer.
    let l1Score = 0, l2Score = 0, sevSum = 0, weightCount = 0;
    const stepProfiles: Array<{
      profile: SuspicionProfile;
      row: SourceRow;
    }> = [];

    for (const e of events) {
      const p = pickProfile(e.suspicion_type);
      l1Score += p.layer1 * p.severity;
      l2Score += p.layer2 * p.severity;
      sevSum += p.severity;
      weightCount += 1;
      stepProfiles.push({ profile: p, row: e });
    }

    const baseLayer1 = weightCount ? Math.min(1, l1Score / Math.max(weightCount, 1) + 0.1) : 0.12;
    const baseLayer2 = weightCount ? Math.min(1, l2Score / Math.max(weightCount, 1) + 0.1) : 0.1;
    const empJitter = jitter(req.employee_id);

    const layer1Belief = normalizeMasses({
      fraud: Math.max(0, Math.min(1, baseLayer1 + empJitter)),
      legitimate: Math.max(0, 1 - baseLayer1 - 0.1 - empJitter),
      uncertain: 0.1,
    });
    const layer2Belief = normalizeMasses({
      fraud: Math.max(0, Math.min(1, baseLayer2 - empJitter)),
      legitimate: Math.max(0, 1 - baseLayer2 - 0.1 + empJitter),
      uncertain: 0.1,
    });

    const { fused } = dempsterCombine(layer1Belief, layer2Belief);
    const severity = classifySeverity(fused);

    // Build SHAP-style causal chain — sort events by descending profile.severity,
    // top 6, then derive ordered narrative with timestamps.
    const ordered = stepProfiles
      .sort((a, b) => b.profile.severity - a.profile.severity)
      .slice(0, 6);

    const causal_chain: CausalStep[] = ordered.map((s, i) => {
      const dt = s.row.action_datetime ? new Date(s.row.action_datetime) : new Date();
      return {
        order: i + 1,
        timestamp: s.row.action_datetime || null,
        feature: s.profile.feature,
        description: `${format(dt, "HH:mm 'on' dd MMM")} — ${s.profile.template(s.row.metadata || {})}`,
        contribution: round(s.profile.layer2 * s.profile.severity, 3),
        probability: round(Math.max(0.0001, Math.min(0.95, 1 - s.profile.severity)), 4),
      };
    });

    const chain_probability =
      causal_chain.length === 0
        ? 1
        : round(causal_chain.reduce((acc, s) => acc * s.probability, 1), 8);

    const causal_chain_text =
      causal_chain.length === 0
        ? "No anomalous events observed in the last 30 days."
        : causal_chain.map((s) => s.description).join("  →  ") +
          `.  Chain probability: ${(chain_probability * 100).toFixed(4)}%`;

    const risk_score = round(fused.fraud, 4);

    return {
      employee_id: req.employee_id,
      triggered_at,
      risk_score,
      severity,
      layer1: { score: round(baseLayer1, 4), belief: layer1Belief, community_distance: round(2 + l1Score, 2) },
      layer2: { score: round(baseLayer2, 4), belief: layer2Belief },
      fused_belief: fused,
      causal_chain,
      causal_chain_text,
      chain_probability,
      detector_version: `mock-${this.version}-${employee ? "ctx" : "ctxless"}`,
      source_event_ids: req.source_event_ids,
    };
  },
};

function round(n: number, d = 4): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
