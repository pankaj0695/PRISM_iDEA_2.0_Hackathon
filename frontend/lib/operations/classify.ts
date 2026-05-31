import type { Account, Employee } from "@/lib/db/schemas";
import type { ClassificationResult, OperationRequest } from "./types";

interface Context {
  request: OperationRequest;
  employee: Employee;
  account?: Account | null;
  now: Date;
}

const HIGH_VALUE_INR = 100_000;
const BULK_EXPORT_THRESHOLD = 100;
const BULK_ACCESS_THRESHOLD = 20;

function isOffHours(d: Date): boolean {
  const h = d.getHours();
  return h < 9 || h >= 18;
}

/** Rule-based classifier — mirrors the 12 suspicion_types seeded into Phase 1. */
export function classifyOperation(ctx: Context): ClassificationResult {
  const { request, employee, account, now } = ctx;
  const reasons: string[] = [];
  const isMyBranch = account?.branch_id === employee.branch_id;

  switch (request.action) {
    case "TRANSACTION_INITIATE": {
      const amt = request.amount_inr ?? 0;

      if (employee.approval_authority_inr > 0 && amt > employee.approval_authority_inr) {
        reasons.push(
          `Amount ₹${amt.toLocaleString("en-IN")} exceeds your approval authority of ₹${employee.approval_authority_inr.toLocaleString("en-IN")}.`,
        );
        return { suspicious: true, suspicion_type: "APPROVAL_LIMIT_BREACH", reasons, emits_transaction: true };
      }
      if (account?.status === "DORMANT") {
        reasons.push(`Touched a DORMANT account (last txn ${account.last_transaction_date ?? "unknown"}).`);
        return { suspicious: true, suspicion_type: "DORMANT_ACCOUNT_ACTIVITY", reasons, emits_transaction: true };
      }
      if (isOffHours(now) && amt >= HIGH_VALUE_INR) {
        reasons.push(`High-value transaction initiated outside banking hours.`);
        return { suspicious: true, suspicion_type: "OFF_HOURS_HIGH_VALUE", reasons, emits_transaction: true };
      }
      if (account && !isMyBranch) {
        reasons.push(`Account belongs to branch ${account.branch_id}, you are at ${employee.branch_id}.`);
        return { suspicious: true, suspicion_type: "CROSS_BRANCH_ACCESS", reasons, emits_transaction: true };
      }
      return { suspicious: false, suspicion_type: null, reasons, emits_transaction: true };
    }

    case "FD_BREAK": {
      if (!employee.can_break_fd) {
        reasons.push(`Your role does not have permission to break Fixed Deposits.`);
        return { suspicious: true, suspicion_type: "PRIVILEGE_ESCALATION_ATTEMPT", reasons, emits_transaction: true };
      }
      const matures = account?.maturity_date ? new Date(account.maturity_date) : null;
      const premature = matures ? matures.getTime() > now.getTime() : true;
      if (premature) {
        reasons.push(
          `Breaking FD before maturity${matures ? ` (matures ${matures.toISOString().slice(0, 10)})` : ""}.`,
        );
        return { suspicious: true, suspicion_type: "FD_PREMATURE_BREAK", reasons, emits_transaction: true };
      }
      return { suspicious: false, suspicion_type: null, reasons, emits_transaction: true };
    }

    case "ACCOUNT_VIEW": {
      if (account?.status === "DORMANT") {
        reasons.push(`Viewed a DORMANT account.`);
        return { suspicious: true, suspicion_type: "DORMANT_ACCOUNT_ACTIVITY", reasons, emits_transaction: false };
      }
      if (account && !isMyBranch) {
        reasons.push(`Viewed an account outside your branch.`);
        return { suspicious: true, suspicion_type: "CROSS_BRANCH_ACCESS", reasons, emits_transaction: false };
      }
      if (isOffHours(now)) {
        reasons.push(`Account access outside banking hours.`);
        return { suspicious: true, suspicion_type: "OFF_HOURS_LOGIN", reasons, emits_transaction: false };
      }
      return { suspicious: false, suspicion_type: null, reasons, emits_transaction: false };
    }

    case "BULK_ACCOUNT_ACCESS": {
      const count = request.account_ids?.length ?? 0;
      if (count >= BULK_ACCESS_THRESHOLD) {
        reasons.push(`Accessed ${count} customer accounts in a single session (threshold ${BULK_ACCESS_THRESHOLD}).`);
        return { suspicious: true, suspicion_type: "BULK_ACCOUNT_ACCESS", reasons, emits_transaction: false };
      }
      return { suspicious: false, suspicion_type: null, reasons, emits_transaction: false };
    }

    case "BULK_DATA_EXPORT": {
      const count = request.record_count ?? 0;
      if (count >= BULK_EXPORT_THRESHOLD) {
        reasons.push(`Bulk export of ${count} records (threshold ${BULK_EXPORT_THRESHOLD}).`);
        return { suspicious: true, suspicion_type: "BULK_DATA_EXPORT", reasons, emits_transaction: false };
      }
      return { suspicious: false, suspicion_type: null, reasons, emits_transaction: false };
    }

    case "OVERRIDE_LIMIT": {
      if (!employee.can_override_limits) {
        reasons.push(`Attempted to override approval limits without permission.`);
        return { suspicious: true, suspicion_type: "PRIVILEGE_ESCALATION_ATTEMPT", reasons, emits_transaction: false };
      }
      const amt = request.amount_inr ?? 0;
      if (amt > employee.approval_authority_inr * 2) {
        reasons.push(`Override is more than 2× your normal authority — flagged for analyst review.`);
        return { suspicious: true, suspicion_type: "APPROVAL_LIMIT_BREACH", reasons, emits_transaction: false };
      }
      return { suspicious: false, suspicion_type: null, reasons, emits_transaction: false };
    }

    case "CONFIG_CHANGE": {
      // System config touches are inherently sensitive.
      reasons.push(`System configuration changed.`);
      return { suspicious: true, suspicion_type: "PRIVILEGE_ESCALATION_ATTEMPT", reasons, emits_transaction: false };
    }

    default:
      return { suspicious: false, suspicion_type: null, reasons: [], emits_transaction: false };
  }
}
