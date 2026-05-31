/**
 * Public detection entrypoint. Today this dispatches to the mock detector
 * built from the seeded `is_suspicious` labels. Wire a real model by:
 *  1. Implementing a new module that exports a `Detector`.
 *  2. Branching here on `process.env.DETECTOR`.
 * No API route, no UI, no DB code needs to change.
 */
import type { Detector, DetectionRequest, DetectionResult } from "./types";
import { mockDetector } from "./mockDetector";

export type { Detector, DetectionRequest, DetectionResult };

let _detector: Detector = mockDetector;

export function getDetector(): Detector {
  const choice = (process.env.DETECTOR || "mock").toLowerCase();
  if (choice === "mock") return mockDetector;
  // Placeholder for future adapters:
  //   if (choice === "fastapi") return fastapiDetector;
  //   if (choice === "onnx")    return onnxDetector;
  return _detector;
}

export async function runDetection(req: DetectionRequest): Promise<DetectionResult> {
  return getDetector().run(req);
}
