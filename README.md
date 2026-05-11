# PRISM — Privileged-user Risk Identification & Surveillance Monitoring

AI-powered insider-fraud early-warning system for Union Bank of India.
Submitted to iDEA 2.0 Hackathon by **Team GangOfFour** (VESIT, Mumbai).

This repo contains the Next.js app (Phase 3 backend + Phase 4 frontend) built on top of the
Phase 1 synthetic dataset stored in MongoDB. Phase 2 ML notebooks output `layer1_gat.pt`,
`layer2_iforest.pkl`, and `fusion_engine.py` artifacts which drop in behind the
`lib/detect/` seam.

## Getting started

```bash
# 1. Install deps (uses Next.js 16, React 19, Tailwind v4)
npm install

# 2. Make sure .env.local has the right MongoDB URI + secret
#    The defaults point at the team's hosted cluster.
cat .env.local

# 3. Run the dev server
npm run dev
# → http://localhost:3000

# 4. (Optional) Pre-populate the alerts collection so the dashboard is non-empty
npm run seed-alerts            # writes ~250 alerts from seeded suspicious events
npm run seed-alerts -- --reset # drop existing alerts first
```

## Demo logins

All accounts use password `prism123`. Role is auto-derived from the employee's
`role_category` / `designation` in MongoDB.

| Employee code | Role likely derived       | Lands on   |
|---------------|---------------------------|------------|
| `EMP_00001`   | ADMIN / FRAUD_ANALYST     | `/admin`   |
| `EMP_00007`   | BRANCH_MANAGER            | `/manager` |
| `EMP_00050`   | EMPLOYEE                  | `/employee`|

You can sign in as any of the 400 seeded employees; their role is derived from their
`role_category` field. The login page has clickable demo accounts.

## Architecture

```
Next.js App (App Router, TypeScript, Tailwind v4)
├── app/login                            UB-themed sign in
├── app/(admin)        ADMIN, FRAUD_ANALYST
│   ├── /admin                           KPIs, live feed, severity trend
│   ├── /admin/alerts                    Severity-filtered queue
│   ├── /admin/alerts/[id]               Belief masses + causal chain + actions
│   ├── /admin/graph                     React Flow relationship network
│   └── /admin/whatif                    What-If simulator
├── app/(manager)      BRANCH_MANAGER, COMPLIANCE_OFFICER
│   └── /manager …                       Branch-scoped queue + investigation
└── app/(employee)     EMPLOYEE
    ├── /employee                        Self-service portal landing
    ├── /employee/activity               My logs / logins / devices
    └── /employee/disclosure             Voluntary external-account disclosure

app/api/*    REST routes (JWT cookie auth, RBAC scoping)
├── /api/auth                            login / logout / me
├── /api/branches, /api/employees, /api/customers,
│   /api/accounts, /api/transactions,
│   /api/activity-logs, /api/dependents  Seven collection routes
├── /api/alerts*, /api/alerts/:id/disposition
├── /api/detect/run, /api/detect/whatif  Calls lib/detect.runDetection()
├── /api/graph/network                   Nodes + edges for React Flow
├── /api/realtime                        SSE — alert.new / alert.updated
├── /api/me/activity, /api/me/disclosure
└── /api/stats/overview, /api/stats/severity-trend

lib/
├── db/mongo.ts, db/schemas.ts           Mongo singleton + TS types per collection
├── auth/jwt.ts, auth/rbac.ts,           JWT (jose) + 5-role capability matrix
│   auth/withAuth.ts                     Route wrapper enforcing capability checks
├── api/respond.ts, api/list.ts          Validation + paginated list helper
├── detect/                              Pluggable detector seam
│   ├── types.ts                         DetectionRequest / DetectionResult
│   ├── severity.ts                      Dempster–Shafer combination + threshold map
│   ├── mockDetector.ts                  Deterministic stub keyed on is_suspicious
│   └── index.ts                         Branches on process.env.DETECTOR
└── realtime/sse.ts                      In-process pub/sub + SSE stream
```

## How to drop in real ML models

`lib/detect/index.ts` is the single seam. To attach trained artifacts:

```ts
// lib/detect/fastapiDetector.ts
export const fastapiDetector: Detector = {
  name: "fastapi",
  version: "1.0.0",
  async run(req) {
    const r = await fetch("http://ml:8000/predict", {
      method: "POST",
      body: JSON.stringify(req),
      headers: { "content-type": "application/json" },
    });
    return r.json();
  },
};
```

Then add `DETECTOR=fastapi` to `.env.local` and wire it in `getDetector()`. The route
shape (`risk_score`, `severity`, `layer1`, `layer2`, `fused_belief`, `causal_chain`,
`causal_chain_text`, `chain_probability`) is the API contract — no UI or API route
changes are needed.

## Data

Backed by MongoDB at `MONGODB_URI` (see `.env.local`). Seven collections matching the
implementation document Section 3 — branches (49), employees (400), dependents (665),
customers (2,000), accounts (3,837), transactions (21,785), activity_logs (45,382),
plus derived `alerts`, `alert_audit`, `disclosures` collections.

## Theming

Union Bank of India palette — primary red `#E30613`, secondary blue `#003B71`, accent
yellow `#FFB81C`. Inter via `next/font`. PRISM logo at `public/PRISM_logo.png`.

---

Team GangOfFour — VESIT Mumbai. Pankaj Gupta · Chinmay Desai · Harshavardhan Khamkar · Aanchal Gupta.
