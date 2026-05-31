// Five-role RBAC matrix derived from the implementation document, section 8.

export type Role =
  | "ADMIN"
  | "FRAUD_ANALYST"
  | "BRANCH_MANAGER"
  | "COMPLIANCE_OFFICER"
  | "EMPLOYEE";

export type Capability =
  | "alerts.view.system"
  | "alerts.view.branch"
  | "alerts.view.own"
  | "alerts.confirm"
  | "alerts.dismiss"
  | "alerts.escalate"
  | "accounts.freeze"
  | "accounts.freeze.recommend"
  | "whatif.run"
  | "graph.view.system"
  | "graph.view.branch"
  | "graph.view.own"
  | "system.configure"
  | "self.portal"
  | "self.activity"
  | "self.disclose";

const MATRIX: Record<Role, Capability[]> = {
  ADMIN: [
    "alerts.view.system",
    "alerts.view.branch",
    "alerts.view.own",
    "alerts.confirm",
    "alerts.dismiss",
    "alerts.escalate",
    "accounts.freeze",
    "whatif.run",
    "graph.view.system",
    "graph.view.branch",
    "graph.view.own",
    "system.configure",
    "self.portal",
    "self.activity",
    "self.disclose",
  ],
  FRAUD_ANALYST: [
    "alerts.view.system",
    "alerts.view.branch",
    "alerts.view.own",
    "alerts.confirm",
    "alerts.dismiss",
    "alerts.escalate",
    "accounts.freeze",
    "whatif.run",
    "graph.view.system",
    "graph.view.branch",
    "graph.view.own",
    "self.portal",
    "self.activity",
    "self.disclose",
  ],
  BRANCH_MANAGER: [
    "alerts.view.branch",
    "alerts.view.own",
    "alerts.confirm",
    "alerts.dismiss",
    "alerts.escalate",
    "accounts.freeze.recommend",
    "whatif.run",
    "graph.view.branch",
    "graph.view.own",
    "self.portal",
    "self.activity",
    "self.disclose",
  ],
  COMPLIANCE_OFFICER: [
    "alerts.view.system",
    "alerts.view.branch",
    "alerts.view.own",
    "alerts.confirm",
    "alerts.dismiss",
    "alerts.escalate",
    "whatif.run",
    "graph.view.system",
    "graph.view.branch",
    "graph.view.own",
    "self.portal",
    "self.activity",
    "self.disclose",
  ],
  EMPLOYEE: [
    "alerts.view.own",
    "graph.view.own",
    "self.portal",
    "self.activity",
    "self.disclose",
  ],
};

export function can(role: Role, cap: Capability): boolean {
  return MATRIX[role]?.includes(cap) ?? false;
}

export function homeForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
    case "FRAUD_ANALYST":
      return "/admin";
    case "BRANCH_MANAGER":
    case "COMPLIANCE_OFFICER":
      return "/manager";
    case "EMPLOYEE":
    default:
      return "/employee";
  }
}

/**
 * Map a seeded employee to a PRISM RBAC role using grade + role_category + designation.
 * The Phase-1 dataset uses 4 role categories (Branch Operations, IT, Loan Origination,
 * Treasury) and grades Scale-I … Scale-V; we project those onto PRISM's 5-role matrix.
 */
export function deriveRoleFromCategory(
  role_category: string | undefined,
  designation?: string,
  grade?: string,
): Role {
  const rc = (role_category || "").toUpperCase();
  const dg = (designation || "");
  const gd = (grade || "").toUpperCase();

  // Explicit categories override (in case future data adds them).
  if (rc.includes("ADMIN")) return "ADMIN";
  if (rc.includes("AUDIT") || rc.includes("FRAUD")) return "FRAUD_ANALYST";
  if (rc.includes("COMPLIANCE")) return "COMPLIANCE_OFFICER";

  // Top of the house — full ADMIN.
  if (gd === "SCALE-V" || /Assistant General Manager|General Manager|DGM|AGM/i.test(dg))
    return "ADMIN";

  // Branch leadership.
  if (/Branch Head|Branch Manager|Chief Manager/i.test(dg)) return "BRANCH_MANAGER";

  // Treasury / IT seniors investigate — wire them into the analyst role.
  if (gd === "SCALE-IV" && (rc.includes("IT") || rc.includes("TREASURY"))) return "FRAUD_ANALYST";

  // Senior managers in branch operations → BRANCH_MANAGER.
  if (gd === "SCALE-IV") return "BRANCH_MANAGER";

  // Treasury seniors → compliance.
  if (gd === "SCALE-III" && rc.includes("TREASURY") && /Senior Manager/i.test(dg))
    return "COMPLIANCE_OFFICER";

  return "EMPLOYEE";
}
