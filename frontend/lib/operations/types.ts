/**
 * Live banking operations exposed through /api/operations. Each operation
 * generates an activity_log entry, and (optionally) a transaction record;
 * a rule classifier flags suspicion which the detector then scores.
 */

export type OperationAction =
  | "TRANSACTION_INITIATE"
  | "FD_BREAK"
  | "ACCOUNT_VIEW"
  | "BULK_ACCOUNT_ACCESS"
  | "BULK_DATA_EXPORT"
  | "OVERRIDE_LIMIT"
  | "CONFIG_CHANGE";

export interface OperationRequest {
  action: OperationAction;
  // Common targets:
  account_id?: string;
  customer_id?: string;
  // Transaction-style payload:
  amount_inr?: number;
  transaction_type?: string;
  narration?: string;
  channel?: string;
  // Bulk / metadata:
  record_count?: number;
  account_ids?: string[];
  // Optional override of "now" for demo purposes (ISO 8601). When omitted
  // we use server time. Useful so a judge can see the off-hours flow at noon.
  pretend_now?: string;
}

export type SuspicionType =
  | "OFF_HOURS_HIGH_VALUE"
  | "DORMANT_ACCOUNT_ACTIVITY"
  | "FD_PREMATURE_BREAK"
  | "APPROVAL_LIMIT_BREACH"
  | "COLLUSION_COORDINATED_ACCESS"
  | "BULK_DATA_EXPORT"
  | "OFF_HOURS_LOGIN"
  | "UNKNOWN_DEVICE_IP"
  | "BULK_ACCOUNT_ACCESS"
  | "REPEATED_FAILED_LOGIN"
  | "PRIVILEGE_ESCALATION_ATTEMPT"
  | "CROSS_BRANCH_ACCESS";

export interface ClassificationResult {
  suspicious: boolean;
  suspicion_type: SuspicionType | null;
  reasons: string[];
  // Whether the action also produces a transaction (vs only an activity log).
  emits_transaction: boolean;
}
