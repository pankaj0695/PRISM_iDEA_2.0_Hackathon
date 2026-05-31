<div align="center">
  <img src="frontend/public/PRISM_logo.png" alt="PRISM Logo" width="120" />
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

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Detection Pipeline](#detection-pipeline)
- [Role-Based Access](#role-based-access)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend](#frontend)
  - [Backend (Local)](#backend-local)
- [Sample Dataset](#sample-dataset)
- [Deployed Services](#deployed-services)
- [Known Limitations](#known-limitations)
- [Team](#team)

---

## Problem Statement

Insider fraud by privileged bank employees remains a critical and largely unsolved problem. In large institutions like Union Bank of India, monitoring employee activity across dozens of branches and systems is highly complex. Evolving fraud tactics — FD breakage and fund routing, bribery in loan processing, bulk data export, drip transfers below alert thresholds — continue to exploit gaps in existing monitoring.

Current rule-based fraud systems suffer from several structural limitations:

- High false-positive rates that overwhelm investigation teams
- No ability to detect collusion between employees
- No adaptation to evolving or novel fraud patterns
- No contextual explanation attached to alerts — analysts receive a flag but not a reason
- No ability to connect suspicious activity across different systems, relationships, and time windows

The core challenge, confirmed by Ms. A. Manimekhalai (former MD & CEO, Union Bank of India), is not data availability — banks already have extensive transaction, activity, and employee records. The challenge is transforming that data into actionable, explainable intelligence before financial losses occur. Union Bank's Transaction Banking Department alone prevented over ₹200 crores of FD-breaking fraud last year; PRISM is designed to systematise and scale that capability.

---

## Solution Overview

PRISM is a four-layer AI fraud detection system fused through Dempster-Shafer Evidence Theory. Each layer examines employee behaviour from a fundamentally different signal source. Alerts fire only when multiple independent layers agree — reducing false positives 60–70% versus any single model.

```
Layer 1  →  Graph Neural Network         Structural suspicion via employee–customer–account relationship graph
Layer 2  →  Stacking Ensemble + SHAP     Behavioural anomaly detection over 30-day rolling window; human-readable causal chain
Layer 3  →  Fund Flow Detection          Tracks actual money movement: FD-break chains, drip fraud, office account reconciliation gaps
Layer 4  →  Lifestyle-Income Drift       Continuous income-vs-spending gap monitoring; demographic risk scoring
Fusion   →  Dempster-Shafer Engine       Combines belief masses from all four layers into a single corroborated risk score
```

**Key capabilities:**
- Detects **15+ fraud signals** across all four layers (premature FD breaks, off-hours high-value transactions, bulk data exports, approval limit overrides, cross-branch access, privilege escalation, drip transfers, and more)
- Every alert includes a SHAP-derived causal chain in plain English — no ML expertise required to act on it
- Role-scoped dashboards — each user sees exactly what their clearance permits
- Voluntary disclosure module — employees can declare external accounts to reduce false positives
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

PRISM uses a **5-role capability matrix** auto-derived from each employee's grade and designation.

### 👤 Employee

> **Route:** `/employee` · **Derived from:** Any staff member (Scale I–III, non-managerial)

Transparency portal — employees can view exactly what PRISM records about them, reducing trust gaps and enabling proactive compliance.

| Feature | Description |
|---------|-------------|
| My Activity Log | Full history of every system action: logins, accounts viewed, transactions initiated, approvals granted |
| Trusted Devices & IPs | Devices and IP addresses associated with their sessions in the last 30 days |
| Operations Console | Execute real banking actions — each action is scored in real time |
| Voluntary Disclosure | Submit external bank accounts proactively to reduce false-positive fraud flags |

**What employees cannot see:** Risk scores, belief masses, detection layer outputs, or other employees' alerts.

---

### 🏦 Branch Manager

> **Route:** `/manager` · **Derived from:** Branch Head, Branch Manager, Scale-III/IV in Branch Operations

Branch-scoped investigation queue — all alerts are filtered to the manager's branch.

| Feature | Description |
|---------|-------------|
| Branch Dashboard | KPIs: open alerts, critical count, suspicious events, branch employee count |
| Investigation Queue | All OPEN alerts for employees in this branch, sorted by severity |
| Alert Detail View | Risk score, belief mass bars, SHAP causal chain, employee activity context |
| Disposition Actions | Dismiss (false positive), Escalate (to Admin), Recommend Account Freeze |
| Live Alert Feed | Real-time SSE stream — alerts appear instantly without page refresh |

**Scope restriction:** Managers only see alerts and activity for their own branch (`branch_id` match enforced at the API layer).

---

### 🛡️ Admin / Fraud Analyst

> **Route:** `/admin` · **Derived from:** Assistant General Manager and above (Admin), Audit/IT Security Senior (Fraud Analyst)

Central surveillance command centre — full system-wide visibility across all branches, employees, and alerts.

| Feature | Description |
|---------|-------------|
| System KPIs | Critical alert count, total open alerts, suspicious events, branches monitored, employee/customer totals |
| Live Alert Feed | System-wide real-time SSE stream with belief mass visualisation |
| Alert Queue | Paginated, filterable list of all alerts — filter by severity, status, branch, date range |
| Alert Detail | Full forensic view: belief mass bars, SHAP causal chain, employee context, audit trail |
| Disposition Actions | Confirm Fraud, Dismiss, Escalate, Freeze Account (full authority) |
| Relationship Graph | React Flow network graph of employee–customer–account relationships, coloured by GNN risk score |

| Capability | Fraud Analyst | Admin |
|-----------|:---:|:---:|
| View all alerts | ✅ | ✅ |
| Run What-If | ✅ | ✅ |
| View relationship graph | ✅ | ✅ |
| Freeze accounts | ❌ | ✅ |
| Modify system config | ❌ | ✅ |

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

**Model artifacts:**
- `layer1_gnn_v4.pt` — Trained GNN weights (AUC 0.89, 87k parameters)
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
Performance:    ROC-AUC 0.93–0.98 · F1 0.72–0.87
```

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

### Layer 3 — Dempster-Shafer Fusion (Orchestrator)

**Deployed:** `https://prism-final-layer-660444655892.asia-south1.run.app`  
**Stack:** FastAPI · Motor (async MongoDB) · httpx · Custom Dempster-Shafer implementation

Calls Layer 1 and Layer 2 in parallel, then fuses their outputs using Dempster-Shafer theory.

```
1. Fetch 30-day employee context from MongoDB
2. Query Layer 1 (GNN) + Layer 2 (Ensemble) in parallel
3. Convert each score to a Basic Probability Assignment (BPA) via dual sigmoid
4. Apply Dempster's combination rule:
     K = conflict between sources
     m_fraud_fused = (m1_f·m2_f + m1_f·m2_u + m1_u·m2_f) / (1 − K)
     Fallback to average if K ≈ 1 (extreme source conflict)
5. Classify fused m_fraud → CRITICAL / HIGH / WATCH / CLEAR
```

**Key endpoint:** `POST /api/v1/prism/analyze/{employee_id}`

---

## Frontend Architecture

**Stack:** Next.js 16.2 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · next-intl · TanStack Query · ReactFlow · Recharts

### Routes

```
/login                      Sign-in page (auto-routes by role on success)

/admin                      Admin KPI dashboard + live alert feed
/admin/alerts               System-wide alert queue (severity filter)
/admin/alerts/[id]          Alert forensic detail (belief masses, causal chain, actions)
/admin/graph                ReactFlow employee–customer relationship network

/manager                    Branch-scoped dashboard + KPIs
/manager/alerts             Branch alert queue
/manager/alerts/[id]        Alert detail (branch-scoped)
/manager/operations         Operations console (manager-level actions)

/employee                   Self-service transparency portal
/employee/activity          Personal activity log (logins, actions, transactions)
/employee/disclosure        Voluntary external-account disclosure form
/employee/operations        Operations console (employee-level actions)
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
| **Layer 2 (Ensemble)** | FastAPI, XGBoost 2.0, LightGBM 4.3, Isolation Forest, SHAP |
| **Layer 3 (Fusion)** | FastAPI, Motor (async), httpx, Dempster-Shafer algebra |
| **Database** | MongoDB (native driver + Motor async) |
| **Deployment** | Google Cloud Run (asia-south1), Turbopack (dev) |

### Frontend dependencies (key packages)

```
next@16.2, react@19, typescript, tailwindcss@4
@tanstack/react-query, next-intl, jose
reactflow, recharts, zod
```

### Backend dependencies (per layer)

**Layer 1**
```
fastapi, uvicorn, torch==2.5, torch-geometric
scikit-learn, motor, numpy, pydantic
```

**Layer 2**
```
fastapi, uvicorn, xgboost==2.0, lightgbm==4.3
scikit-learn, shap, imbalanced-learn (SMOTE)
google-cloud-storage, joblib, pandas, numpy, pydantic
```

**Layer 3 (Fusion)**
```
fastapi, uvicorn, httpx, motor, numpy, pydantic
```

Full pinned versions are in each service's `requirements.txt`.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- MongoDB connection (see [Sample Dataset](#sample-dataset) below)

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Required variables:
#   MONGODB_URI   — MongoDB connection string
#   JWT_SECRET    — any long random string
#   DETECTOR      — "prism" (calls deployed ML APIs) or "mock" (offline, no ML calls)
# Optional (defaults to deployed Cloud Run URLs if omitted):
#   LAYER1_URL, LAYER2_URL, FINAL_LAYER_URL

# Start dev server
npm run dev
# → http://localhost:3000

# Seed demo alert data (run once)
npm run seed-alerts
npm run seed-alerts -- --reset   # drop and repopulate
```

### Demo Logins

All demo accounts use password `prism123`. Role is auto-derived from grade and designation.

| Employee Code | Designation | Derived Role | Dashboard |
|---------------|-------------|:------------:|-----------|
| `EMP_00007` | Assistant General Manager — Operations | `ADMIN` | `/admin` |
| `EMP_00001` | Branch Manager (Scale-III) | `BRANCH_MANAGER` | `/manager` |
| `EMP_00050` | Assistant Manager (Scale-II) | `EMPLOYEE` | `/employee` |

Any of the 400 seeded employees can log in. Pre-filled demo buttons are available on the login page.

### Backend (Local)

Each backend layer is a self-contained FastAPI service. Run them in separate terminals.

```bash
# Layer 1 (GNN) — port 8000
cd backend/layer1
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Interactive docs: http://localhost:8000/docs

# Layer 2 (Ensemble) — port 8001
cd backend/layer2
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export LOCAL_MODEL_PATH=models_v5/layer2_v5_bundle.joblib
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
# Interactive docs: http://localhost:8001/docs

# Layer 3 (Final Layer / Fusion) — port 8002
cd backend/final-layer
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export LAYER1_URL=http://localhost:8000
export LAYER2_URL=http://localhost:8001
export MONGODB_URI=<your-mongodb-uri>
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
# Interactive docs: http://localhost:8002/docs
```

To point the frontend at local backends, update `.env.local`:

```env
LAYER1_URL=http://localhost:8000
LAYER2_URL=http://localhost:8001
FINAL_LAYER_URL=http://localhost:8002
```

### Switching the Detector

```env
# .env.local
DETECTOR=prism   # calls deployed Final Layer API (default)
DETECTOR=mock    # deterministic seeded labels — no ML calls, works fully offline
```

---

## Sample Dataset

The MongoDB cluster is pre-seeded with fully synthetic data built around 12 labelled fraud scenario types (73,669 total records across 7 collections).

**Read-only connection string (for evaluation and local testing):**

```
mongodb://PRISMReadOnly:PRISMFTW123@mongo.chinmaydesai.xyz/PRISM
```

Set this as `MONGODB_URI` in your `.env.local` (frontend) and as the `MONGODB_URI` environment variable for the Layer 3 service.

### Collections and record counts

| Collection | Records | Description |
|------------|--------:|-------------|
| `branches` | 49 | Branch master data |
| `employees` | 400 | Employee profiles with grade, designation, salary |
| `customers` | 2,000 | Customer accounts and KYC metadata |
| `accounts` | 3,837 | Employee, customer, dependent, and office accounts |
| `transactions` | 21,785 | Labelled transaction history |
| `activity_logs` | 45,382 | System action logs (logins, exports, approvals, etc.) |
| `dependents` | 665 | Employee-dependent relationships |

### Generating fresh synthetic data

To regenerate the dataset locally (requires Python 3.11+ and the data-generation dependencies):

```bash
cd data-generation
pip install -r requirements.txt
python generate_dataset.py          # generates all 7 collections
python seed_mongo.py                # uploads to the configured MONGODB_URI
```

The generator creates realistic fraud scenarios including FD-break chains, drip transfers, off-hours high-value transactions, and cross-branch collusion rings.

---

## Known Limitations

**Layers 3 & 4 are not in the POC backend.** The Fund Flow Detection (Layer 3) and Lifestyle-Income Drift (Layer 4) layers are fully designed and documented in the architecture documents but are not deployed as live services. The current POC backend comprises Layer 1 (GNN), Layer 2 (Ensemble), and the DS Fusion Orchestrator only.

**Synthetic data only.** All 73,669 records are generated data built around scripted fraud scenarios. Model performance metrics (AUC 0.93–0.98) reflect synthetic distribution; real-world performance against novel fraud patterns would require retraining on production data.

**GNN scores are static per session.** Layer 1 scores all 400 employees once at startup and caches the results in memory. The graph is not updated in real time as new transactions arrive — a `/refresh` endpoint must be called manually to rebuild the graph and re-run inference.

**Cloud Run cold starts.** All three backend services are deployed on Cloud Run with scale-to-zero enabled. On the first request after an idle period, cold-start latency is 15–30 seconds (predominantly PyTorch model loading for Layer 1). The frontend pings all services on page load to pre-warm them.

**Layer 2 model bundle size (~290 MB).** The `layer2_v5_bundle.joblib` artifact is stored on Google Cloud Storage. Local setup requires either downloading this file or running against the deployed Cloud Run URL. Instructions for downloading the bundle are in `backend/layer2/README.md`.

**SSE is in-process only.** The real-time alert feed uses an in-process Node.js `EventTarget` for pub/sub. It does not persist across multiple frontend instances or server restarts — in a production multi-replica deployment, this would need to be replaced with Redis Pub/Sub or a similar message broker.

**No model retraining pipeline.** Analyst dispositions (Confirm Fraud / Dismiss) are written to MongoDB but there is no automated feedback loop to retrain Layer 2. Concept drift detection (Page-Hinkley test) and weekly retraining are designed in the architecture but not implemented in the POC.

---

## Deployed Services

| Service | URL | Region |
|---------|-----|--------|
| Layer 1 — GNN | `https://layer1-fastapi-660444655892.asia-south1.run.app` | asia-south1 |
| Layer 2 — Ensemble | `https://prism-layer2-api-660444655892.asia-south1.run.app` | asia-south1 |
| Final Layer — Fusion | `https://prism-final-layer-660444655892.asia-south1.run.app` | asia-south1 |

All three services expose a `/health` endpoint and interactive Swagger docs at `/docs`.

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
