/**
 * PRISM Real Detector — calls the deployed Final Layer (Layer 3) API.
 *
 * SERVER-SIDE ONLY. This module is never safe to bundle for the browser because
 * it reads process.env secrets and makes direct HTTP calls to internal APIs.
 * The explicit guard below throws at module-load time if accidentally imported
 * on the client, giving a clear error instead of a silent Turbopack panic.
 *
 * The Final Layer orchestrator:
 *   1. Fetches 30-day employee context from MongoDB (no overrides needed).
 *   2. Queries Layer 1 (GNN) and Layer 2 (Stacking Ensemble) in parallel.
 *   3. Fuses results via Dempster-Shafer theory.
 *   4. Returns a CombinedAnalyzeResponse.
 *
 * This adapter maps that response onto the frontend DetectionResult shape.
 */

if (typeof window !== "undefined") {
  throw new Error("prismDetector must only be imported on the server.");
}

import type { Detector, DetectionRequest, DetectionResult } from "./types";
import type { BeliefMasses, CausalStep, Severity } from "@/lib/db/schemas";
import { classifySeverity } from "./severity";

// ── Env vars (server-side only) ───────────────────────────────────────────
const FINAL_LAYER_URL = (
  process.env.FINAL_LAYER_URL ||
  "https://prism-final-layer-660444655892.asia-south1.run.app"
).replace(/\/$/, "");

// ── API response types (mirrors final-layer/models/schemas.py) ────────────

interface ApiBeliefMasses {
  m_fraud: number;
  m_legit: number;
  m_uncertain: number;
}

interface ApiFeatureContribution {
  feature: string;
  raw_value: number;
  shap_contribution: number;
  description: string;
}

interface ApiCombinedAnalyzeResponse {
  status: string;
  employee_id: string;
  scenario_date: string;
  combined_result: {
    risk_level: string;
    belief_masses: ApiBeliefMasses;
    conflict_score: number;
    label: string;
  };
  layer1: {
    gnn_fraud_prob: number;
    belief_masses: ApiBeliefMasses;
    community: number;
    risk_level: string;
  };
  layer2: {
    ensemble_score: number;
    xgboost_score: number;
    lightgbm_score: number;
    isolation_forest_score: number;
    risk_level: string;
    bpa_used: ApiBeliefMasses;
  };
  risk_signals: Record<string, boolean>;
  causal_chain: {
    narrative: string;
    top_features: ApiFeatureContribution[];
  };
  metadata: {
    model_version_l1: string;
    model_version_l2: string;
    fusion_method: string;
    inference_time_ms: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convert API's {m_fraud, m_legit, m_uncertain} → frontend {fraud, legitimate, uncertain} */
function mapBelief(b: ApiBeliefMasses): BeliefMasses {
  return {
    fraud: b.m_fraud,
    legitimate: b.m_legit,
    uncertain: b.m_uncertain,
  };
}

/** Map API risk_level string → frontend Severity */
function mapSeverity(level: string): Severity {
  const upper = level?.toUpperCase();
  if (upper === "CRITICAL") return "CRITICAL";
  if (upper === "HIGH") return "HIGH";
  if (upper === "WATCH") return "WATCH";
  return "CLEAR";
}

/**
 * Convert SHAP top_features into CausalStep[].
 * We use |shap_contribution| as the contribution and derive a conditional
 * probability from it (higher SHAP = lower "normal" probability).
 */
function buildCausalChain(
  topFeatures: ApiFeatureContribution[],
  triggeredAt: string,
): CausalStep[] {
  return topFeatures.map((f, i) => {
    const contribution = Math.abs(f.shap_contribution);
    // P(normal | feature) — inverted from shap contribution, clamped to (0.0001, 0.95)
    const probability = Math.max(0.0001, Math.min(0.95, 1 - contribution));
    return {
      order: i + 1,
      timestamp: triggeredAt,
      feature: f.feature,
      description: f.description,
      contribution: round(contribution, 4),
      probability: round(probability, 4),
    };
  });
}

function round(n: number, d = 4): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

// ── Detector implementation ───────────────────────────────────────────────

export const prismDetector: Detector = {
  name: "prism",
  version: "1.0.0",

  async run(req: DetectionRequest): Promise<DetectionResult> {
    const triggeredAt = new Date().toISOString();
    const scenarioDate = triggeredAt.slice(0, 10); // "YYYY-MM-DD"

    // Minimal payload — Final Layer fetches context from MongoDB itself
    const payload = {
      employee_id: req.employee_id,
      scenario_date: scenarioDate,
    };

    const url = `${FINAL_LAYER_URL}/api/v1/prism/analyze/${encodeURIComponent(req.employee_id)}`;

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[PRISM Detector] ▶ Calling Final Layer API");
    console.log(`  URL     : POST ${url}`);
    console.log(`  Payload :`, JSON.stringify(payload, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let data: ApiCombinedAnalyzeResponse;

    try {
      // Use explicit AbortController — AbortSignal.timeout() can confuse some
      // bundler static-analysis passes and trigger a Turbopack panic.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`[PRISM Detector] ✗ HTTP ${response.status}:`, errText.slice(0, 500));
        throw new Error(
          `PRISM Final Layer returned ${response.status}: ${errText.slice(0, 300)}`,
        );
      }

      data = (await response.json()) as ApiCombinedAnalyzeResponse;

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("[PRISM Detector] ✔ Final Layer API response received");
      console.log("  Full response:\n", JSON.stringify(data, null, 2));
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    } catch (err) {
      console.error("[PRISM Detector] ✗ Request failed:", (err as Error).message);
      throw new Error(
        `PRISM detector failed for ${req.employee_id}: ${(err as Error).message}`,
      );
    }

    // ── Map API response → DetectionResult ─────────────────────────────

    const fusedBelief = mapBelief(data.combined_result.belief_masses);
    const l1Belief = mapBelief(data.layer1.belief_masses);
    const l2Belief = mapBelief(data.layer2.bpa_used);

    // Prefer API's own risk classification; fall back to threshold logic
    const severity: Severity =
      mapSeverity(data.combined_result.risk_level) ??
      classifySeverity(fusedBelief);

    const causalChain = buildCausalChain(
      data.causal_chain.top_features ?? [],
      triggeredAt,
    );

    // Chain probability = product of all step conditional probabilities
    const chainProbability =
      causalChain.length === 0
        ? 1
        : round(
            causalChain.reduce((acc, s) => acc * s.probability, 1),
            8,
          );

    const detectorVersion = [
      `prism-l1:${data.metadata?.model_version_l1 ?? "v4"}`,
      `l2:${data.metadata?.model_version_l2 ?? "v5"}`,
      `fusion:${data.metadata?.fusion_method ?? "dempster-shafer"}`,
    ].join("|");

    return {
      employee_id: data.employee_id,
      triggered_at: triggeredAt,
      risk_score: round(fusedBelief.fraud, 4),
      severity,
      layer1: {
        score: round(data.layer1.gnn_fraud_prob, 4),
        belief: l1Belief,
        community_distance: data.layer1.community,
      },
      layer2: {
        score: round(data.layer2.ensemble_score, 4),
        belief: l2Belief,
      },
      fused_belief: fusedBelief,
      causal_chain: causalChain,
      causal_chain_text: data.causal_chain.narrative || "No causal narrative available.",
      chain_probability: chainProbability,
      detector_version: detectorVersion,
      source_event_ids: req.source_event_ids,
    };
  },
};
