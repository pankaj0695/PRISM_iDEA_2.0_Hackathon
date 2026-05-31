// TypeScript surface for the seven PRISM collections + derived alert collection.
// Field names mirror the implementation document (section 3) and the seeded JSON files.

export type ISODate = string;

export interface Branch {
  branch_id: string;
  branch_code: string;
  ifsc_code: string;
  branch_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  region: string;
  branch_type: string;
  branch_size: string;
  total_employees: number;
  total_customers: number;
  branch_manager_id: string;
  established_date: ISODate;
  category: string;
  has_treasury_desk: boolean;
  has_locker_facility: boolean;
  operating_hours: string;
}

export type RoleCategory =
  | "BRANCH_OPERATIONS"
  | "BRANCH_MANAGEMENT"
  | "RELATIONSHIP_MANAGER"
  | "IT_OPERATIONS"
  | "COMPLIANCE"
  | "AUDIT"
  | "ADMIN"
  | string;

export interface Employee {
  employee_id: string;
  employee_code: string;
  full_name: string;
  gender: string;
  date_of_birth: ISODate;
  age: number;
  date_of_joining: ISODate;
  tenure_years: number;
  designation: string;
  role_category: RoleCategory;
  grade: string;
  branch_id: string;
  reports_to_employee_id: string | null;
  department: string;
  declared_monthly_salary: number;
  pan_number: string;
  email: string;
  phone: string;
  system_access_level: string;
  approval_authority_inr: number;
  can_break_fd: boolean;
  can_override_limits: boolean;
  can_modify_customer_data: boolean;
  biometric_id: string;
  dependent_ids: string[];
  managed_customer_ids: string[];
  joining_branch_id: string;
  transfer_history: Array<{ branch_id: string; from: ISODate; to: ISODate | null }>;
  demographic_risk_band: string;
  status: string;
  created_at: ISODate;
  updated_at: ISODate;
  account_ids: string[];
}

export interface Customer {
  customer_id: string;
  branch_id: string;
  customer_type: string;
  full_name: string;
  gender: string;
  date_of_birth: ISODate;
  age: number;
  pan_number: string;
  aadhar_last4: string;
  mobile_number: string;
  email: string;
  address: string;
  relationship_manager_id: string | null;
  total_accounts: number;
  has_loan_account: boolean;
  has_dormant_account: boolean;
  risk_category: string;
  kyc_status: string;
  is_politically_exposed: boolean;
  is_vip_customer: boolean;
  total_transactions_90d: number;
  last_activity_date: ISODate | null;
  onboarding_date: ISODate;
  created_at: ISODate;
  updated_at: ISODate;
  account_ids: string[];
}

export type AccountStatus = "ACTIVE" | "DORMANT" | "CLOSED" | string;
export type HolderType = "CUSTOMER" | "EMPLOYEE" | "DEPENDENT" | string;

export interface Account {
  account_id: string;
  account_number: string;
  account_type: string;
  holder_type: HolderType;
  holder_id: string;
  branch_id: string;
  ifsc_code: string;
  balance_inr: number;
  status: AccountStatus;
  opened_date: ISODate;
  last_transaction_date: ISODate | null;
  maturity_date: ISODate | null;
  nomination_registered: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export type DebitCredit = "DEBIT" | "CREDIT" | string;

export interface Transaction {
  transaction_id: string;
  account_id: string;
  account_number: string;
  holder_type: HolderType;
  holder_id: string;
  branch_id: string;
  transaction_type: string;
  debit_credit: DebitCredit;
  amount_inr: number;
  channel: string;
  initiated_by_employee_id: string | null;
  transaction_datetime: ISODate;
  transaction_date: ISODate;
  transaction_time: string;
  narration: string;
  reference_number: string;
  counterparty_account: string | null;
  counterparty_name: string | null;
  status: string;
  is_suspicious: boolean;
  suspicion_type: string | null;
  created_at: ISODate;
}

export interface ActivityLog {
  log_id: string;
  session_id: string;
  employee_id: string;
  branch_id: string;
  action_type: string;
  target_entity_type: string;
  target_entity_id: string;
  ip_address: string;
  device_id: string;
  action_datetime: ISODate;
  action_date: ISODate;
  action_time: string;
  status: string;
  is_suspicious: boolean;
  suspicion_type: string | null;
  metadata: Record<string, unknown>;
  created_at: ISODate;
}

export interface Dependent {
  dependent_id: string;
  employee_id: string;
  full_name: string;
  relationship: string;
  gender: string;
  date_of_birth: ISODate;
  age: number;
  pan_number: string | null;
  aadhar_last4: string | null;
  is_financially_dependent: boolean;
  has_bank_account: boolean;
  bank_account_number: string | null;
  declared_assets_inr: number;
  same_address_as_employee: boolean;
  created_at: ISODate;
  updated_at: ISODate;
  account_id: string | null;
}

/* Derived collections */

export type Severity = "CRITICAL" | "HIGH" | "WATCH" | "CLEAR";
export type AlertStatus = "OPEN" | "INVESTIGATING" | "CONFIRMED_FRAUD" | "DISMISSED" | "ESCALATED";

export interface BeliefMasses {
  fraud: number;
  legitimate: number;
  uncertain: number;
}

export interface CausalStep {
  order: number;
  timestamp: ISODate | null;
  feature: string;
  description: string;
  contribution: number; // SHAP-style contribution
  probability: number; // conditional probability
}

export interface Alert {
  alert_id: string;
  employee_id: string;
  employee_name?: string;
  branch_id: string;
  event_type: string;
  event_metadata?: Record<string, unknown>;
  triggered_at: ISODate;
  severity: Severity;
  risk_score: number;
  layer1: { score: number; belief: BeliefMasses; community_distance?: number };
  layer2: { score: number; belief: BeliefMasses };
  fused_belief: BeliefMasses;
  causal_chain: CausalStep[];
  causal_chain_text: string;
  chain_probability: number;
  status: AlertStatus;
  disposition?: {
    decision: string;
    notes?: string;
    decided_by: string;
    decided_at: ISODate;
  };
  source_event_ids?: string[]; // transaction_ids / log_ids that triggered
  detector_version: string;
}

export interface AlertAuditEntry {
  audit_id: string;
  alert_id: string;
  actor_employee_id: string;
  actor_role: string;
  action: string;
  before?: unknown;
  after?: unknown;
  notes?: string;
  at: ISODate;
}

export interface Disclosure {
  disclosure_id: string;
  employee_id: string;
  external_bank_name: string;
  external_account_number: string;
  ifsc_code?: string;
  account_holder_relationship: string;
  declared_balance_inr?: number;
  reason: string;
  submitted_at: ISODate;
  status: "SUBMITTED" | "REVIEWED" | "ACCEPTED" | "REJECTED";
}
