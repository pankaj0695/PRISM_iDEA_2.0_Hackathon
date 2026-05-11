import type { BeliefMasses, Severity } from "@/lib/db/schemas";

// Thresholds from the implementation document, section 2.3 (Table 1).
export function classifySeverity(b: BeliefMasses): Severity {
  if (b.fraud > 0.85) return "CRITICAL";
  if (b.fraud >= 0.5) return "HIGH";
  if (b.uncertain > 0.4) return "WATCH";
  if (b.legitimate > 0.85) return "CLEAR";
  // Fallback band
  if (b.fraud >= 0.3) return "HIGH";
  return "WATCH";
}

/**
 * Dempster–Shafer combination rule for two independent sources over the
 * frame Θ = {Fraud, Legitimate}. The "uncertain" mass is treated as Θ.
 * Returns the fused mass and the conflict K.
 */
export function dempsterCombine(
  m1: BeliefMasses,
  m2: BeliefMasses,
): { fused: BeliefMasses; conflict: number } {
  // products of focal-element pairs
  const ff = m1.fraud * m2.fraud;
  const ll = m1.legitimate * m2.legitimate;
  const fL = m1.fraud * m2.legitimate;
  const lF = m1.legitimate * m2.fraud;
  const fU = m1.fraud * m2.uncertain;
  const uF = m1.uncertain * m2.fraud;
  const lU = m1.legitimate * m2.uncertain;
  const uL = m1.uncertain * m2.legitimate;
  const uu = m1.uncertain * m2.uncertain;

  const K = fL + lF; // mass on empty set (conflict)
  const denom = 1 - K;
  if (denom <= 0) {
    // Total conflict — return uncertain everything.
    return { fused: { fraud: 0, legitimate: 0, uncertain: 1 }, conflict: 1 };
  }

  const fused: BeliefMasses = {
    fraud: (ff + fU + uF) / denom,
    legitimate: (ll + lU + uL) / denom,
    uncertain: uu / denom,
  };
  return { fused, conflict: K };
}

export function normalizeMasses(b: Partial<BeliefMasses>): BeliefMasses {
  const f = Math.max(0, b.fraud ?? 0);
  const l = Math.max(0, b.legitimate ?? 0);
  const u = Math.max(0, b.uncertain ?? 0);
  const s = f + l + u || 1;
  return { fraud: f / s, legitimate: l / s, uncertain: u / s };
}
