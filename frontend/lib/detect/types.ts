import type { BeliefMasses, CausalStep, Severity } from "@/lib/db/schemas";

export type { BeliefMasses, CausalStep, Severity };

export interface DetectionRequest {
  employee_id: string;
  event_type: string;
  event_metadata?: Record<string, unknown>;
  /** optional pointer back to source rows */
  source_event_ids?: string[];
}

export interface DetectionResult {
  employee_id: string;
  triggered_at: string;
  risk_score: number; // 0..1
  severity: Severity;
  layer1: { score: number; belief: BeliefMasses; community_distance?: number };
  layer2: { score: number; belief: BeliefMasses };
  fused_belief: BeliefMasses;
  causal_chain: CausalStep[];
  causal_chain_text: string;
  chain_probability: number;
  detector_version: string;
  source_event_ids?: string[];
}

export interface Detector {
  name: string;
  version: string;
  run(req: DetectionRequest): Promise<DetectionResult>;
}
