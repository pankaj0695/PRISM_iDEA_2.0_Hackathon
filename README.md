<div align="center">
  <img src="frontend/public/PRISM_logo.png" alt="PRISM Logo" width="120" />
  <h1>PRISM</h1>
  <p><strong>Privileged-user Risk Identification &amp; Surveillance Monitoring</strong></p>
  <p>AI-powered insider fraud early-warning platform for financial institutions</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/FastAPI-3-009688?logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/PyTorch-2.5-EE4C2C?logo=pytorch" alt="PyTorch" />
    <img src="https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Deployed-Cloud%20Run-4285F4?logo=google-cloud" alt="Cloud Run" />
  </p>

  <p><em>Submitted to iDEA 2.0 Hackathon · Team GangOfFour · VESIT, Mumbai</em></p>
</div>

---

## Table of Contents

- [Overview](#overview)
- [Detection Pipeline](#detection-pipeline)
- [Role-Based Access](#role-based-access)
  - [Employee](#-employee)
  - [Branch Manager](#-branch-manager)
  - [Admin / Fraud Analyst](#-admin--fraud-analyst)
- [Backend Architecture](#backend-architecture)
  - [Layer 1 — Graph Neural Network](#layer-1--graph-neural-network)
  - [Layer 2 — Stacking Ensemble](#layer-2--stacking-ensemble)
  - [Layer 3 — Dempster-Shafer Fusion](#layer-3--dempster-shafer-fusion-final-layer)
- [Frontend Architecture](#frontend-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Deployed Services](#deployed-services)
- [Team](#team)

---

## Overview

PRISM is a four-phase insider fraud detection system built for banking institutions. It monitors privileged users (employees, managers, admins) and surfaces anomalous behaviour in real time using a two-layer ML pipeline fused via Dempster-Shafer theory.

```
Phase 1 → Synthetic Dataset     400 employees · 2K customers · 21.7K transactions · 45.3K activity logs
Phase 2 → ML Notebooks          GNN training (GAT) · Stacking Ensemble (XGBoost + LightGBM + IsoForest)
Phase 3 → Backend APIs          3 FastAPI services deployed on Google Cloud Run
Phase 4 → Frontend Dashboard    Next.js App Router · 3 role dashboards · 10 Indian languages · SSE live feed
```

**Key capabilities:**
- Detects **15 fraud signals** (premature FD breaks, off-hours high-value transactions, bulk data exports, approval limit overrides, cross-branch access, privilege escalation, and more)
- Explainable results — every alert includes a SHAP-derived causal chain in plain English
- Role-scoped dashboards — each user sees exactly what their clearance permits
- Voluntary disclosure module — employees can proactively declare external accounts to reduce false positives
- Real-time SSE feed — alerts stream to the admin dashboard the moment they are raised

---

## Detection Pipeline

```
Employee/Manager performs an action
        │
        ▼
┌─────────────────────────────────┐
│  Operations Console (Frontend)  │
│  Classify → is it suspicious?   │
│  Rule engine: 12 suspicion types│
└────────────┬────────────────────┘
             │ suspicious = true
             ▼
┌─────────────────────────────────┐     ┌─────────────────────────────┐
│  Layer 1: Graph Neural Network  │     │  Layer 2: Stacking Ensemble │
│  HeteroSAGE on employee graph   │◄────►  XGBoost + LightGBM +       │
│  → GNN fraud prob               │     │  IsolationForest + SHAP     │
│  → Belief masses (BPA)          │     │  → Ensemble score           │
│  → Louvain community            │     │  → SHAP causal chain        │
└─────────────┬───────────────────┘     └──────────────┬──────────────┘
              │                                        │
              └──────────────────┬─────────────────────┘
                                 ▼
              ┌────────────────────────────────────────┐
              │  Layer 3: Dempster-Shafer Fusion        │
              │  Combines BPAs from both layers         │
              │  → Fused {m_fraud, m_legit, m_uncertain}│
              │  → Conflict score K                     │
              │  → Severity: CRITICAL / HIGH / WATCH    │
              └───────────────┬────────────────────────┘
                              │
                              ▼
              ┌────────────────────────────────────────┐
              │  Alert Created in MongoDB              │
              │  SSE event published → Admin Dashboard │
              │  Causal chain + belief bars rendered   │
              └────────────────────────────────────────┘
```

### Severity Thresholds

| Severity | Fused m_fraud | Indicator | Action |
|----------|:-------------:|-----------|--------|
| 🔴 CRITICAL | ≥ 0.85 | Immediate escalation | Auto-freeze recommendation, notified to ADMIN |
| 🟠 HIGH | 0.50 – 0.84 | Urgent review | Analyst triage within 2 hours |
| 🟡 WATCH | 0.40 – 0.49 | Passive monitoring | 24-hour re-evaluation |
| 🟢 CLEAR | < 0.40 | No anomaly | Audit log only |

---

## Role-Based Access

PRISM uses a **5-role capability matrix** auto-derived from each employee's grade and designation. The login screen auto-routes each user to their appropriate dashboard.

### 👤 Employee

> **Route:** `/employee` · **Derived from:** Any staff member (Scale I–III, non-managerial)

The Employee dashboard is a **transparency portal** — employees can see exactly what PRISM records about them, reducing trust gaps and enabling proactive compliance.

**Access & Features:**

| Feature | Description |
|---------|-------------|
| **My Activity Log** | Full history of every system action: logins, accounts viewed, transactions initiated, approvals granted |
| **Trusted Devices & IPs** | List of devices and IP addresses associated with their sessions in the last 30 days |
| **Recent Logins** | Session-level login history with timestamps and locations |
| **Operations Console** | Execute real banking actions (transaction initiation, account view, bulk access, data export) — each action is scored in real time |
| **Voluntary Disclosure** | Submit external bank accounts proactively to reduce the risk of false-positive fraud flags |

**Permitted operations:**

```
TRANSACTION_INITIATE   Debit a customer account (flags if over-limit, off-hours, or dormant)
ACCOUNT_VIEW           Pull up a customer account (flags if cross-branch, dormant, or off-hours)
BULK_ACCOUNT_ACCESS    Access 20+ accounts in one session (auto-flagged at threshold)
BULK_DATA_EXPORT       Export customer records (auto-flagged at 100+ rows)
```

**What employees cannot see:** Risk scores, belief masses, detection layer outputs, or other employees' alerts.

---

### 🏦 Branch Manager

> **Route:** `/manager` · **Derived from:** Branch Head, Branch Manager, Scale-III/IV in Branch Operations

The Branch Manager dashboard provides a **branch-scoped investigation queue** — all alerts are filtered to the manager's branch. Managers can investigate, escalate, or recommend account freezes for cases within their jurisdiction.

**Access & Features:**

| Feature | Description |
|---------|-------------|
| **Branch Dashboard** | KPIs: open alerts, critical count, suspicious events, branch employee count |
| **Investigation Queue** | All OPEN alerts raised for employees in this branch, sorted by severity |
| **Alert Detail View** | Risk score, belief mass bars (Layer 1 + Layer 2 + Fused), SHAP causal chain, employee activity context |
| **Disposition Actions** | Dismiss (false positive), Escalate (to Admin), Recommend Account Freeze |
| **Operations Console** | Higher-privilege operations with stricter scoring |
| **Live Alert Feed** | Real-time SSE stream — alerts appear instantly without page refresh |

**Additional operations (manager-only):**

```
FD_BREAK               Break a Fixed Deposit (premature break is the primary FD-fraud scenario)
OVERRIDE_LIMIT         Approve transactions above standard authority
CONFIG_CHANGE          System configuration changes — always reviewed by an analyst
```

**Scope restriction:** Managers only see alerts and activity for their own branch (`branch_id` match enforced at the API layer).

---

### 🛡️ Admin / Fraud Analyst

> **Route:** `/admin` · **Derived from:** Assistant General Manager and above (Admin), Audit/IT Security Senior (Fraud Analyst)

The Admin dashboard is the **central surveillance command centre** — full system-wide visibility across all branches, employees, and alerts.

**Access & Features:**

| Feature | Description |
|---------|-------------|
| **System KPIs** | Critical alert count, total open alerts, suspicious events (txns + logs), dormant accounts, branches monitored, employee/customer totals |
| **Live Alert Feed** | System-wide real-time SSE stream with severity accent bars, risk score rings, Layer 1/Layer 2/Fused score chips, and belief mass visualisation |
| **Alert Queue** | Paginated, filterable list of all alerts across all branches — filter by severity, status, branch, date range |
| **Alert Detail** | Full forensic view: belief mass bars, SHAP causal chain with timestamps and probabilities, employee context, raw event metadata, audit trail |
| **Disposition Actions** | Confirm Fraud, Dismiss, Escalate, Freeze Account (full authority) |
| **Relationship Graph** | React Flow network graph of employee–customer–account–dependent relationships, coloured by GNN risk score |
| **Severity Trend Chart** | Daily alert distribution by severity for the last 30 days |
| **Operations Monitor** | Real-time feed of all flagged operations with layer scores and belief bars |

**System-wide scope:** No branch restriction — Admins see all alerts, all employees, all branches.

**Fraud Analyst vs Admin distinction:**

| Capability | Fraud Analyst | Admin |
|-----------|:---:|:---:|
| View all alerts | ✅ | ✅ |
| Run What-If | ✅ | ✅ |
| View relationship graph | ✅ | ✅ |
| Freeze accounts | ❌ | ✅ |
| Modify system config | ❌ | ✅ |
| View all employee data | ✅ | ✅ |

---

## Backend Architecture

### Layer 1 — Graph Neural Network

**Deployed:** `https://layer1-fastapi-660444655892.asia-south1.run.app`  
**Stack:** FastAPI · PyTorch 2.5 · PyTorch Geometric · scikit-learn · MongoDB

Builds a **heterogeneous graph** of employees, customers, accounts, and dependents. Runs a `HeteroSAGE` (Heterogeneous GraphSAGE with LayerNorm) model at startup and caches per-employee fraud scores in memory.

```
Nodes:  employees (400) + customers (2K) + accounts (3.8K) + dependents (665)
Edges:  manages, holds, transacts_with, related_to
Output: per-employee GNN fraud probability → converted to Dempster-Shafer BPA
```

**Artifacts:**
- `layer1_gnn_v4.pt` — Trained GNN weights
- `graph_metadata_v4.pkl` — Graph structure + Louvain community assignments
- `layer1_scaler.pkl` — Employee feature scaler

**Key endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | API status + graph summary |
| `/api/v1/layer1/score/{employee_id}` | GET | GNN score + belief masses for one employee |
| `/api/v1/layer1/analyze` | POST | Batch scores for multiple employees |
| `/api/v1/layer1/community/{id}` | GET | All employees in a Louvain community |
| `/api/v1/layer1/suspicious` | GET | Employees above fraud threshold |
| `/api/v1/layer1/refresh` | POST | Reload data, rebuild graph, re-run inference |

---

### Layer 2 — Stacking Ensemble

**Deployed:** `https://prism-layer2-api-660444655892.asia-south1.run.app`  
**Stack:** FastAPI · XGBoost 2.0 · LightGBM 4.3 · scikit-learn · SHAP · Google Cloud Storage

A **three-model stacking ensemble** trained on 181 engineered features. Analyzes 30-day transaction and activity history per employee.

```
Base Learners:  XGBoost · LightGBM · Isolation Forest
Meta Learner:   Logistic Regression (combines the three scores)
Training:       SMOTE oversampling · leakage-free feature engineering
Explainability: SHAP TreeExplainer → top contributing features per prediction
```

**Feature groups (181 total):**

| Group | Examples |
|-------|---------|
| Daily aggregates | Transaction count, total amount, off-hours flag, FD breaks |
| Rolling windows | 7d / 14d / 30d averages for key signals |
| Self-baseline z-scores | Today's behaviour vs own 30-day history |
| Peer-group z-scores | Behaviour vs role-category peers |
| Interaction features | off_hours × high_value, off_hours × data_export |

**15 risk signals detected:**

```
fd_premature_break      off_hours_transaction    high_value_transaction
limit_override          transfer_to_dependent    transfer_to_employee_account
off_hours_login         bulk_account_access      cross_branch_access
new_ip_address          repeated_failed_login    privilege_change
data_export             transaction_volume_spike amount_spike
```

**Key endpoint:** `POST /api/v1/layer2/analyze`  
Input: employee context + 30-day transactions + 30-day activity logs  
Output: label (FRAUD/NORMAL) + ensemble score + per-model scores + SHAP causal chain + risk signals

---

### Layer 3 — Dempster-Shafer Fusion (Final Layer)

**Deployed:** `https://prism-final-layer-660444655892.asia-south1.run.app`  
**Stack:** FastAPI · Motor (async MongoDB) · httpx · Custom Dempster-Shafer implementation

The **orchestration layer** — calls Layer 1 and Layer 2 in parallel, then fuses their outputs using Dempster-Shafer theory.

```
1. Fetch 30-day employee context from MongoDB (or accept overrides in request body)
2. Query Layer 1 (GNN)     →  {gnn_fraud_prob, belief_masses, community}
   Query Layer 2 (Ensemble) →  {ensemble_score, causal_chain, risk_signals}   (parallel)
3. Convert each score to a Basic Probability Assignment (BPA) via dual sigmoid
4. Apply Dempster's combination rule:
     K = conflict between sources
     m_fraud_fused   = (m1_f·m2_f + m1_f·m2_u + m1_u·m2_f) / (1 − K)
     m_legit_fused   = (m1_l·m2_l + m1_l·m2_u + m1_u·m2_l) / (1 − K)
     m_uncertain     = (m1_u·m2_u) / (1 − K)
     Fallback to average if K ≈ 1 (extreme source conflict)
5. Classify fused m_fraud → CRITICAL / HIGH / WATCH / CLEAR
6. Return combined result + per-layer details + causal chain + risk signals
```

**Key endpoint:** `POST /api/v1/prism/analyze/{employee_id}`

---

## Frontend Architecture

**Stack:** Next.js 16.2 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · next-intl · TanStack Query · ReactFlow · Recharts

### Routes

```
/login                              Sign-in page (auto-routes by role on success)

/admin                              Admin KPI dashboard + live alert feed
/admin/alerts                       System-wide alert queue (severity filter)
/admin/alerts/[id]                  Alert forensic detail (belief masses, causal chain, actions)
/admin/graph                        ReactFlow employee–customer relationship network

/manager                            Branch-scoped dashboard + KPIs
/manager/alerts                     Branch alert queue
/manager/alerts/[id]                Alert detail (branch-scoped)
/manager/operations                 Operations console (manager-level actions)

/employee                           Self-service transparency portal
/employee/activity                  Personal activity log (logins, actions, transactions)
/employee/disclosure                Voluntary external-account disclosure form
/employee/operations                Operations console (employee-level actions)
```

### API Routes

```
POST /api/auth/login                Credential verification + JWT cookie
POST /api/auth/logout               Cookie clear
GET  /api/auth/me                   Current user profile + role

GET  /api/branches                  Branch list
GET  /api/employees                 Employee directory
GET  /api/customers                 Customer list
GET  /api/accounts                  Account list
GET  /api/transactions              Transaction history
GET  /api/activity-logs             Activity log query
GET  /api/dependents                Dependent relationships

POST /api/operations                Execute + classify + detect + alert (single action pipeline)
GET  /api/alerts                    Alert list (severity, status, branch filters)
GET  /api/alerts/[id]               Alert detail
POST /api/alerts/[id]/disposition   Record disposition (confirm / dismiss / escalate / freeze)

GET  /api/graph/network             Nodes + edges for ReactFlow
GET  /api/realtime                  SSE stream (alert.new, alert.updated)
GET  /api/stats/overview            System KPIs
GET  /api/stats/severity-trend      7 / 30-day severity trend

GET  /api/me/activity               Current user's own logs
POST /api/me/disclosure             Submit voluntary disclosure

POST /api/locale                    Persist language preference to cookie
```

### Multilingual Support

UI translated into **10 Indian languages** via `next-intl`:

| Code | Language | Script |
|------|----------|--------|
| `en` | English | Latin |
| `hi` | Hindi | देवनागरी |
| `bn` | Bengali | বাংলা |
| `te` | Telugu | తెలుగు |
| `mr` | Marathi | देवनागरी |
| `ta` | Tamil | தமிழ் |
| `ur` | Urdu | اُردُو (RTL) |
| `gu` | Gujarati | ગુજરાતી |
| `kn` | Kannada | ಕನ್ನಡ |
| `ml` | Malayalam | മലയാളം |

Language preference persists in a `prism_locale` cookie. Switch from the globe icon in the header.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **Auth** | JWT (jose), HTTP-only cookies, 5-role RBAC matrix |
| **State / Data** | TanStack React Query, Zod validation |
| **Realtime** | Server-Sent Events (in-process EventTarget pub/sub) |
| **Visualization** | ReactFlow (network graph), Recharts (trend charts) |
| **i18n** | next-intl, 10 languages including RTL (Urdu) |
| **Layer 1 (GNN)** | FastAPI, PyTorch 2.5, PyTorch Geometric, scikit-learn |
| **Layer 2 (Ensemble)** | FastAPI, XGBoost, LightGBM, Isolation Forest, SHAP |
| **Layer 3 (Fusion)** | FastAPI, Motor (async), httpx, Dempster-Shafer algebra |
| **Database** | MongoDB (native driver + Motor async) |
| **Deployment** | Google Cloud Run (asia-south1), Turbopack (dev) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Access to the MongoDB cluster (credentials in `.env.local`)

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Verify environment
cat .env.local
# Required: MONGODB_URI, JWT_SECRET, DETECTOR=prism (or mock)
# Optional: LAYER1_URL, LAYER2_URL, FINAL_LAYER_URL (defaults to deployed Cloud Run URLs)

# Start dev server
npm run dev
# → http://localhost:3000

# Seed the alerts collection (run once to populate demo data)
npm run seed-alerts
npm run seed-alerts -- --reset   # drop and repopulate
```

### Demo Logins

All accounts use password `prism123`. Role is auto-derived from grade and designation.

| Employee Code | Designation | Derived Role | Dashboard |
|---------------|-------------|:------------:|-----------|
| `EMP_00007` | Assistant General Manager — Operations | `ADMIN` | `/admin` |
| `EMP_00001` | Branch Manager (Scale-III) | `BRANCH_MANAGER` | `/manager` |
| `EMP_00050` | Assistant Manager (Scale-II) | `EMPLOYEE` | `/employee` |

Any of the 400 seeded employees can log in. Click the pre-filled demo account buttons on the login page.

### Backend (Local)

Each backend layer is a self-contained FastAPI service:

```bash
# Layer 1 (GNN) — port 8000
cd backend/layer1
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Docs: http://localhost:8000/docs

# Layer 2 (Ensemble) — port 8001
cd backend/layer2
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export LOCAL_MODEL_PATH=models_v5/layer2_v5_bundle.joblib
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
# Docs: http://localhost:8001/docs

# Layer 3 (Final Layer) — port 8002
cd backend/final-layer
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export LAYER1_URL=http://localhost:8000
export LAYER2_URL=http://localhost:8001
export MONGODB_URI=<your-mongodb-uri>
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
# Docs: http://localhost:8002/docs
```

To switch the frontend to local backends, update `.env.local`:
```env
LAYER1_URL=http://localhost:8000
LAYER2_URL=http://localhost:8001
FINAL_LAYER_URL=http://localhost:8002
```

### Switching the Detector

```env
# .env.local
DETECTOR=prism   # calls deployed Final Layer API (default)
DETECTOR=mock    # uses deterministic seeded labels (no ML calls, works offline)
```

---

## Deployed Services

| Service | URL | Region |
|---------|-----|--------|
| Layer 1 — GNN | `https://layer1-fastapi-660444655892.asia-south1.run.app` | asia-south1 |
| Layer 2 — Ensemble | `https://prism-layer2-api-660444655892.asia-south1.run.app` | asia-south1 |
| Final Layer — Fusion | `https://prism-final-layer-660444655892.asia-south1.run.app` | asia-south1 |

All three services expose a `/health` endpoint. The frontend pings them on startup to wake Cloud Run instances from idle.

---

## Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/pankaj0695">
        <img src="https://github.com/pankaj0695.png" width="100px;" alt="Pankaj Gupta" style="border-radius:50%"/><br />
        <sub><b>Pankaj Gupta</b></sub>
      </a><br />
      <a href="https://github.com/pankaj0695">@pankaj0695</a>
    </td>
    <td align="center">
      <a href="https://github.com/ChinmayDesai2005">
        <img src="https://github.com/ChinmayDesai2005.png" width="100px;" alt="Chinmay Desai" style="border-radius:50%"/><br />
        <sub><b>Chinmay Desai</b></sub>
      </a><br />
      <a href="https://github.com/ChinmayDesai2005">@ChinmayDesai2005</a>
    </td>
    <td align="center">
      <a href="https://github.com/Harshavardhan-28">
        <img src="https://github.com/Harshavardhan-28.png" width="100px;" alt="Harshavardhan Khamkar" style="border-radius:50%"/><br />
        <sub><b>Harshavardhan Khamkar</b></sub>
      </a><br />
      <a href="https://github.com/Harshavardhan-28">@Harshavardhan-28</a>
    </td>
    <td align="center">
      <a href="https://github.com/AanchalGupta1162">
        <img src="https://github.com/AanchalGupta1162.png" width="100px;" alt="Aanchal Gupta" style="border-radius:50%"/><br />
        <sub><b>Aanchal Gupta</b></sub>
      </a><br />
      <a href="https://github.com/AanchalGupta1162">@AanchalGupta1162</a>
    </td>
  </tr>
</table>

**Team GangOfFour** · VESIT, Mumbai · iDEA 2.0 Hackathon

---

<div align="center">
  <sub>PRISM · Fraud Intelligence Platform · Built with ❤️ for financial security</sub>
</div>
