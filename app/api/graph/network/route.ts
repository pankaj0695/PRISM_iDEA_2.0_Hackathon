import { withAuth } from "@/lib/auth/withAuth";
import { bad, forbidden, ok, serverError } from "@/lib/api/respond";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import type { Account, Customer, Dependent, Employee, Transaction } from "@/lib/db/schemas";

type GraphNode = {
  id: string;
  label: string;
  kind: "EMPLOYEE" | "DEPENDENT" | "ACCOUNT" | "CUSTOMER" | "BRANCH";
  meta?: Record<string, unknown>;
};
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: "OWNS" | "DEPENDENT_OF" | "MANAGES" | "TRANSACTED_WITH" | "AT_BRANCH";
  weight?: number;
};

export const GET = withAuth(async (req, { user }) => {
  try {
    const url = new URL(req.url);
    const employee_id = url.searchParams.get("employee_id") || (user.role === "EMPLOYEE" ? user.sub : null);
    if (!employee_id) return bad("employee_id required");

    if (user.role === "EMPLOYEE" && employee_id !== user.sub) return forbidden();

    const emps = await getCollection<Employee>(COLLECTIONS.employees);
    const employee = await emps.findOne({ employee_id });
    if (!employee) return bad("Employee not found");

    if (user.role === "BRANCH_MANAGER" && employee.branch_id !== user.branch_id) return forbidden();

    const deps = await getCollection<Dependent>(COLLECTIONS.dependents);
    const accs = await getCollection<Account>(COLLECTIONS.accounts);
    const custs = await getCollection<Customer>(COLLECTIONS.customers);
    const txs = await getCollection<Transaction>(COLLECTIONS.transactions);

    const [dependents, employeeAccounts, managedCustomers] = await Promise.all([
      deps.find({ employee_id }).toArray(),
      accs.find({ holder_type: "EMPLOYEE", holder_id: employee_id }).toArray(),
      custs
        .find({ customer_id: { $in: employee.managed_customer_ids || [] } })
        .toArray(),
    ]);

    // Top-N transactions initiated by this employee in the last 90 days, joined to counterparty accounts.
    const recentTx = await txs
      .find({ initiated_by_employee_id: employee_id })
      .sort({ transaction_datetime: -1 })
      .limit(60)
      .toArray();

    const counterpartyAccIds = Array.from(
      new Set(recentTx.map((t) => t.account_id).filter(Boolean)),
    );
    const counterpartyAccounts = counterpartyAccIds.length
      ? await accs.find({ account_id: { $in: counterpartyAccIds } }).toArray()
      : [];

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();
    const add = (n: GraphNode) => {
      if (seen.has(n.id)) return;
      seen.add(n.id);
      nodes.push(n);
    };

    add({
      id: employee.employee_id,
      label: `${employee.full_name}\n${employee.designation}`,
      kind: "EMPLOYEE",
      meta: { grade: employee.grade, role_category: employee.role_category, branch_id: employee.branch_id },
    });
    add({ id: employee.branch_id, label: employee.branch_id, kind: "BRANCH" });
    edges.push({
      id: `e_${employee.employee_id}_${employee.branch_id}`,
      source: employee.employee_id,
      target: employee.branch_id,
      kind: "AT_BRANCH",
    });

    for (const d of dependents) {
      add({
        id: d.dependent_id,
        label: `${d.full_name}\n(${d.relationship})`,
        kind: "DEPENDENT",
        meta: { relationship: d.relationship, has_bank_account: d.has_bank_account },
      });
      edges.push({
        id: `e_${employee.employee_id}_${d.dependent_id}`,
        source: employee.employee_id,
        target: d.dependent_id,
        kind: "DEPENDENT_OF",
      });
      if (d.account_id) {
        add({ id: d.account_id, label: d.account_id, kind: "ACCOUNT", meta: { holder_type: "DEPENDENT" } });
        edges.push({
          id: `e_${d.dependent_id}_${d.account_id}`,
          source: d.dependent_id,
          target: d.account_id,
          kind: "OWNS",
        });
      }
    }

    for (const a of employeeAccounts) {
      add({
        id: a.account_id,
        label: `${a.account_id}\n${a.account_type} ${a.status}`,
        kind: "ACCOUNT",
        meta: { holder_type: "EMPLOYEE", status: a.status, balance_inr: a.balance_inr },
      });
      edges.push({
        id: `e_${employee.employee_id}_${a.account_id}`,
        source: employee.employee_id,
        target: a.account_id,
        kind: "OWNS",
      });
    }

    for (const c of managedCustomers) {
      add({
        id: c.customer_id,
        label: `${c.full_name}\n${c.customer_type}`,
        kind: "CUSTOMER",
        meta: { risk_category: c.risk_category, is_vip_customer: c.is_vip_customer },
      });
      edges.push({
        id: `e_${employee.employee_id}_${c.customer_id}`,
        source: employee.employee_id,
        target: c.customer_id,
        kind: "MANAGES",
      });
      for (const aid of c.account_ids || []) {
        if (!seen.has(aid)) {
          add({ id: aid, label: aid, kind: "ACCOUNT", meta: { holder_type: "CUSTOMER" } });
        }
        edges.push({
          id: `e_${c.customer_id}_${aid}`,
          source: c.customer_id,
          target: aid,
          kind: "OWNS",
        });
      }
    }

    // Aggregate transaction counts to counterparty accounts to weight the edges.
    const txCount = new Map<string, number>();
    for (const t of recentTx) {
      if (!t.account_id) continue;
      txCount.set(t.account_id, (txCount.get(t.account_id) || 0) + 1);
    }
    for (const a of counterpartyAccounts) {
      if (!seen.has(a.account_id)) {
        add({ id: a.account_id, label: a.account_id, kind: "ACCOUNT", meta: { holder_type: a.holder_type, status: a.status } });
      }
      edges.push({
        id: `e_tx_${employee.employee_id}_${a.account_id}`,
        source: employee.employee_id,
        target: a.account_id,
        kind: "TRANSACTED_WITH",
        weight: txCount.get(a.account_id) || 1,
      });
    }

    return ok({ employee_id, nodes, edges });
  } catch (e) {
    return serverError(e);
  }
});
