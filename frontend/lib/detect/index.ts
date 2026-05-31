/**
 * Public detection entrypoint. Dispatches to the configured detector.
 *
 * DETECTOR env var controls which backend is used:
 *   "mock"  — seeded is_suspicious labels (no model calls)
 *   "prism" — deployed Final Layer API (GNN + Ensemble + Dempster-Shafer fusion)
 *
 * No API route, no UI, no DB code needs to change when switching detectors.
 */
import type { Detector, DetectionRequest, DetectionResult } from "./types";
import { mockDetector } from "./mockDetector";
import { prismDetector } from "./prismDetector";

export type { Detector, DetectionRequest, DetectionResult };

export function getDetector(): Detector {
  const choice = (process.env.DETECTOR || "mock").toLowerCase();
  if (choice === "prism") return prismDetector;
  return mockDetector;
}

export async function runDetection(req: DetectionRequest): Promise<DetectionResult> {
  return getDetector().run(req);
}
