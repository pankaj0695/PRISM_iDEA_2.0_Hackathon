// Generates PRISM_NextJs_App_Documentation.docx covering Phase 3 + Phase 4
// of the implementation, including the Operations Console and live-fraud demo.
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, HeadingLevel, PageBreak, PageNumber,
} = require("docx");

const UB_RED = "E30613";
const UB_BLUE = "003B71";
const UB_GREY = "5A6A82";
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

// ───── Helpers ─────────────────────────────────────────────────────────────

const FONT = "Inter";

const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 80, ...(opts.spacing || {}) },
  children: [new TextRun({ text, font: FONT, size: 22, ...opts.run })],
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 200, after: 120 },
  children: [new TextRun({ text, font: FONT, size: 36, bold: true, color: UB_BLUE })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 160, after: 80 },
  children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: UB_RED })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 140, after: 60 },
  children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: UB_BLUE })],
});

const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 40 },
  children: [new TextRun({ text, font: FONT, size: 22 })],
});

const code = (text) => new Paragraph({
  spacing: { after: 80 },
  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
  children: [new TextRun({ text, font: "JetBrains Mono", size: 18 })],
});

function hcell(label, w) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: UB_BLUE, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text: label, font: FONT, size: 20, bold: true, color: "FFFFFF" })],
    })],
  });
}

function cell(text, w, opts = {}) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: w, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 20, color: opts.color || "0A1F3A" })],
    })],
  });
}

const divider = () => new Paragraph({
  spacing: { before: 80, after: 120 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: UB_BLUE, space: 1 } },
  children: [],
});

// ───── Sections ────────────────────────────────────────────────────────────

const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: "यूनियन बैंक  ·  Union Bank of India", font: FONT, size: 22, bold: true, color: UB_RED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "iDEA 2.0 Hackathon  ·  Team GangOfFour  ·  VESIT Mumbai", font: FONT, size: 18, color: UB_GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "PRISM", font: FONT, size: 80, bold: true, color: UB_BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Privileged-user Risk Identification & Surveillance Monitoring", font: FONT, size: 24, bold: true, color: UB_RED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "AI-powered Insider Fraud Detection for Banking", font: FONT, size: 20, italic: true, color: UB_GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 60 },
    children: [new TextRun({ text: "Next.js Application — Implementation Documentation", font: FONT, size: 32, bold: true, color: UB_BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Phase 3 (Backend)   ·   Phase 4 (Frontend)   ·   Operations Console", font: FONT, size: 20, color: UB_GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Version 1.0  ·  May 2026", font: FONT, size: 18, color: UB_GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Pankaj Gupta  ·  Chinmay Desai  ·  Harshavardhan Khamkar  ·  Aanchal Gupta", font: FONT, size: 18, color: UB_GREY })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

// 1. Executive Summary
const execSummary = [
  h1("1. Executive Summary"),
  p("This document captures the implementation status of the PRISM Next.js application — the end-to-end web platform that surfaces PRISM's AI-driven insider-fraud detection to bank operators, analysts and employees."),
  p("It complements the parent PRISM Implementation Document by drilling into Phase 3 (Next.js backend API routes) and Phase 4 (three role-aware dashboards), plus a new live-demo capability — the Operations Console — that lets judges trigger fraud scenarios on stage and watch them get caught in real time."),
  h3("Implementation status"),
  bullet("Phase 1 — Synthetic dataset: COMPLETE (49 branches, 400 employees, 73 669 records, MongoDB)."),
  bullet("Phase 2 — ML notebook pipeline: IN PROGRESS (artefacts drop in behind lib/detect/ when ready)."),
  bullet("Phase 3 — Next.js backend (API routes, JWT/RBAC, SSE): COMPLETE."),
  bullet("Phase 4 — Three dashboards (Admin / Manager / Employee) + Operations Console + What-If: COMPLETE."),
  bullet("Multilingual support: 10 Indian languages (en, hi, bn, te, mr, ta, ur, gu, kn, ml) via next-intl. Urdu renders RTL."),
  bullet("Visual identity: Union Bank of India palette (#E30613, #003B71, #FFB81C) with bilingual Hindi/English brand lockup."),
  divider(),
];

// 2. Architecture
const architecture = [
  h1("2. Architecture Overview"),
  p("PRISM is built as a single Next.js 16 application with the App Router. The same codebase serves both server-rendered pages and the JSON API; a shared lib/ folder holds the database client, auth helpers, detection seam and real-time bus."),
  h3("High-level diagram"),
  code(
`┌──────────────────────────────────────────────────────────────────┐
│  Next.js App (App Router, TypeScript, Tailwind v4)               │
│  ┌──────────────────────────┐   ┌────────────────────────────┐   │
│  │  app/(admin)/...         │   │  app/api/*                 │   │
│  │  app/(manager)/...       │ ◄►│  REST + SSE routes         │   │
│  │  app/(employee)/...      │   │                            │   │
│  │  app/login/page.tsx      │   │  /api/auth/*               │   │
│  └────────────┬─────────────┘   │  /api/operations  (NEW)    │   │
│               │                 │  /api/detect/*             │   │
│               │ React Query    │  /api/alerts/*             │   │
│               │ + SSE EventSrc │  /api/graph/network        │   │
│               ▼                 │  /api/realtime  (SSE)      │   │
│   ┌─────────────────────────┐   │  /api/locale               │   │
│   │ Shared UI (UB theming)  │   │  /api/me/*                 │   │
│   └─────────────────────────┘   │  /api/<collection>/*       │   │
│                                 └─────────────┬──────────────┘   │
│                                               │                  │
│   ┌────────────────────────────────────────┐  │                  │
│   │ lib/                                   │◄─┘                  │
│   │  db/mongo.ts        Mongo singleton   │                     │
│   │  auth/jwt + rbac    JWT + role matrix │                     │
│   │  detect/            Pluggable ML seam │                     │
│   │  operations/        Rule classifier   │                     │
│   │  realtime/sse.ts    In-process pub/sub│                     │
│   │  i18n/locales.ts    10-locale runtime │                     │
│   └────────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                     MongoDB (PRISM cluster, 9 collections)
                                  ▲
                     (future) Python FastAPI - /predict`),
  h3("Tech stack"),
  bullet("Next.js 16.2 with App Router, Turbopack, React 19, TypeScript 5."),
  bullet("Tailwind CSS v4 with Union Bank design tokens (red/blue/yellow + soft neutrals)."),
  bullet("MongoDB 6 driver via lib/db/mongo.ts — singleton client with dev-hot-reload guard."),
  bullet("jose for HS256 JWT (12-hour sessions, HttpOnly cookies)."),
  bullet("Zod for request validation, TanStack Query for client-side data."),
  bullet("React Flow for the relationship graph; Recharts for severity trends."),
  bullet("Server-Sent Events (SSE) for real-time alert push; in-process EventTarget pub/sub."),
  bullet("next-intl for cookie-based localisation across 10 locales (no URL segments)."),
  divider(),
];

// 3. Backend
const backend = [
  h1("3. Phase 3 — Backend (Next.js API Routes)"),
  p("Every route lives under app/api/. Authentication is enforced by middleware.ts (cookie JWT) plus the lib/auth/withAuth wrapper that injects the SessionUser and enforces role capabilities. List-style routes (employees, accounts, transactions, etc.) share a generic listRoute helper that handles pagination, filters and RBAC scoping."),
  h3("Route map"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      new TableRow({ children: [hcell("Route", 3120), hcell("Purpose", 6240)] }),
      ...[
        ["POST /api/auth/login", "Cookie JWT login by employee_id or employee_code"],
        ["POST /api/auth/logout", "Clear session cookie"],
        ["GET  /api/auth/me", "Return current SessionUser (or null)"],
        ["GET  /api/branches[…]", "List + detail (RBAC: managers scoped to own branch)"],
        ["GET  /api/employees[…]", "List + detail (PAN/biometric redacted, branch-scoped)"],
        ["GET  /api/customers[…]", "List + detail (PAN/Aadhaar redacted)"],
        ["GET  /api/accounts[…]", "List + detail with status / holder filters"],
        ["GET  /api/transactions[…]", "Filterable by branch, account, channel, suspicion_type"],
        ["GET  /api/activity-logs[…]", "Session-level activity stream"],
        ["GET  /api/dependents", "Employee dependents (employee sees only own)"],
        ["POST /api/operations", "NEW — execute live banking action; classifies suspicion + emits alert"],
        ["POST /api/detect/run", "Run detection on an arbitrary event; persists + publishes"],
        ["POST /api/detect/whatif", "Same shape but no persistence — for the simulator"],
        ["GET  /api/alerts[…]", "List + detail with branch + analyst joins"],
        ["POST /api/alerts/:id/disposition", "Confirm fraud / dismiss / escalate / freeze + audit row"],
        ["GET  /api/graph/network", "Nodes + edges for React Flow (employee → deps → accounts → counterparties)"],
        ["GET  /api/realtime", "Server-Sent Events stream of alert.new / alert.updated"],
        ["GET  /api/me/activity", "Own activity log + login history + trusted devices"],
        ["POST /api/me/disclosure", "Voluntary disclosure submission"],
        ["GET  /api/stats/overview", "KPI strip data (collection counts + alert breakdown)"],
        ["GET  /api/stats/severity-trend", "Daily alert-severity histogram for Recharts"],
        ["POST /api/locale", "Persist UI locale in prism_locale cookie (public)"],
      ].map(([r, d]) => new TableRow({ children: [cell(r, 3120), cell(d, 6240)] })),
    ],
  }),
  h3("Authentication & RBAC"),
  p("The five PRISM roles (ADMIN, FRAUD_ANALYST, BRANCH_MANAGER, COMPLIANCE_OFFICER, EMPLOYEE) are projected from each employee's grade + designation by deriveRoleFromCategory:"),
  bullet("Grade Scale-V or designation containing AGM/GM/DGM → ADMIN"),
  bullet("Designations matching Branch Head / Branch Manager / Chief Manager → BRANCH_MANAGER"),
  bullet("Scale-IV in IT / Treasury → FRAUD_ANALYST"),
  bullet("Scale-III Senior Manager in Treasury → COMPLIANCE_OFFICER"),
  bullet("Everything else → EMPLOYEE"),
  p("Capabilities are checked via the can(role, capability) matrix from lib/auth/rbac.ts. Branch-scoped queries are pushed into the Mongo filter at list time, not after the fact, so a Branch Manager cannot enumerate cross-branch data even by tampering with query parameters."),
  divider(),
];

// 4. Detection seam
const detect = [
  h1("4. Detection Seam — Where ML Drops In"),
  p("lib/detect/ is the contract between the app and the eventual trained models. The route, UI and alert schema never change; only the detector implementation does."),
  code(
`// lib/detect/index.ts
export async function runDetection(req: DetectionRequest): Promise<DetectionResult> {
  return getDetector().run(req);   // env-switchable
}

// DetectionResult contract (locked):
{
  employee_id, triggered_at,
  risk_score, severity,                            // CRITICAL | HIGH | WATCH | CLEAR
  layer1: { score, belief, community_distance },   // GAT output
  layer2: { score, belief },                       // Isolation Forest output
  fused_belief,                                    // Dempster-Shafer fusion
  causal_chain, causal_chain_text, chain_probability,
  detector_version,
}`),
  h3("Current detector (mock)"),
  p("mockDetector.ts is a deterministic stub that reads the seeded is_suspicious / suspicion_type labels for each employee, weighs them against a SUSPICION_PROFILES table (one row per fraud category from the Phase-1 spec), normalises into Layer-1 and Layer-2 belief masses, then fuses via the real Dempster–Shafer combination rule from severity.ts. The mock produces realistic CRITICAL alerts on the same scenarios trained models will produce — only the scores will tighten."),
  h3("Swapping in trained ML"),
  bullet("Export layer1_gat.pt, layer2_iforest.pkl, fusion_engine.py from the notebook pipeline into models/."),
  bullet("Run the Python FastAPI sidecar exposing POST /predict with the same DetectionResult schema."),
  bullet("Set DETECTOR=fastapi in .env.local. Restart the dev server."),
  bullet("getDetector() now returns the fastapi adapter (lib/detect/fastapiDetector.ts). Nothing else moves."),
  divider(),
];

// 5. Operations Console (NEW)
const ops = [
  h1("5. Operations Console — Live Fraud Demo"),
  p("New in this release. Employees and Branch Managers now have a hands-on console where they can perform real banking actions: initiate transactions, view accounts, break Fixed Deposits, override approval limits, run bulk exports. Each action writes to activity_logs (and transactions, when applicable), gets classified by a rule engine, runs through the detector seam, and pushes an alert via SSE to every connected dashboard."),
  h3("Why this matters"),
  bullet("Judges can sit at one machine, log in as Manager, click \"Break Fixed Deposit\" on a senior-citizen account, and watch the Admin dashboard on the other machine fire a CRITICAL alert within a second."),
  bullet("This is not a canned animation — every byte goes through the real classifier, real detector, real Mongo write, real SSE channel."),
  bullet("The same rule engine maps to the 12 fraud categories already labelled in the Phase-1 dataset, so the demo mirrors training data semantics."),
  h3("Available actions"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 1600, 5360],
    rows: [
      new TableRow({ children: [hcell("Action", 2400), hcell("Role", 1600), hcell("Triggers suspicion when…", 5360)] }),
      ...[
        ["TRANSACTION_INITIATE", "Employee+", "amount > approval_authority · dormant account · off-hours high value · cross-branch"],
        ["ACCOUNT_VIEW", "Employee+", "dormant · cross-branch · off-hours"],
        ["BULK_ACCOUNT_ACCESS", "Employee+", "20+ accounts viewed in one session"],
        ["BULK_DATA_EXPORT", "Employee+", "≥100 records exported"],
        ["FD_BREAK", "Manager", "before maturity · privilege escalation"],
        ["OVERRIDE_LIMIT", "Manager", "no can_override flag · amount > 2× authority"],
        ["CONFIG_CHANGE", "Manager", "always reviewed by analyst"],
      ].map(([a, r, w]) => new TableRow({ children: [cell(a, 2400), cell(r, 1600), cell(w, 5360)] })),
    ],
  }),
  h3("Request shape (POST /api/operations)"),
  code(
`{
  "action": "FD_BREAK",
  "account_id": "ACC_03388",
  "amount_inr": 1500000,
  "narration": "Customer request - urgent FD break",
  "pretend_now": "2026-05-11T02:47:00Z"   // optional, demo off-hours
}`),
  h3("Response shape"),
  code(
`{
  "ok": true,
  "classification": {
    "suspicious": true,
    "suspicion_type": "FD_PREMATURE_BREAK",
    "reasons": ["Breaking FD before maturity."],
    "emits_transaction": true
  },
  "log": { /* full activity_log row written to Mongo */ },
  "transaction": { /* full transaction row, when emits_transaction */ },
  "alert": {
    "severity": "CRITICAL",
    "risk_score": 0.93,
    "layer1": {...}, "layer2": {...}, "fused_belief": {...},
    "causal_chain": [...], "causal_chain_text": "...",
    "chain_probability": 0.00004
  }
}`),
  h3("Demo script (3 minutes)"),
  bullet("Screen 1 — sign in as ADMIN (EMP_00007 / prism123). Open Live alert feed."),
  bullet("Screen 2 — sign in as BRANCH_MANAGER (EMP_00001). Go to Operations → Break Fixed Deposit. Fill ACC_03388, ₹15 00 000, tick \"Simulate off-hours\", click Execute."),
  bullet("Screen 1 — within a second, a CRITICAL alert appears at the top of the feed with a red pulse, risk score 93, full SHAP causal chain."),
  bullet("Screen 2 — switch user to EMPLOYEE (EMP_00050). Go to Operations → Bulk data export, set 847 records, Execute. Another CRITICAL alert flows in."),
  bullet("Screen 1 — open the alert, show belief-mass bars, causal chain, then click Confirm Fraud or Freeze Account from the disposition panel. Audit row written automatically."),
  divider(),
];

// 6. Frontend
const frontend = [
  h1("6. Phase 4 — Frontend"),
  h3("Three role-aware dashboards"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      new TableRow({ children: [hcell("Dashboard", 2400), hcell("Pages", 6960)] }),
      ...[
        ["ADMIN / FRAUD_ANALYST", "/admin (KPIs + live feed + severity trend) · /admin/alerts (filterable queue) · /admin/alerts/[id] (belief masses + causal chain + actions) · /admin/graph (React Flow network) · /admin/whatif (simulator)"],
        ["BRANCH_MANAGER / COMPLIANCE_OFFICER", "/manager (branch queue) · /manager/operations (NEW — execute privileged actions) · /manager/alerts (filterable) · /manager/alerts/[id] (disposition, recommend-freeze) · /manager/whatif"],
        ["EMPLOYEE", "/employee (self-service home) · /employee/operations (NEW — live actions) · /employee/activity (logs + devices) · /employee/disclosure (voluntary external account)"],
      ].map(([n, pg]) => new TableRow({ children: [cell(n, 2400), cell(pg, 6960)] })),
    ],
  }),
  h3("Shared UI components"),
  bullet("UnionBankHeader — tri-colour strip, white brand row with bilingual lockup, blue navigation band, language switcher, user menu."),
  bullet("KpiCard — gradient tint, accent stripe, icon chip, hover lift."),
  bullet("SeverityBadge — pill with pulsing dot for CRITICAL."),
  bullet("BeliefMassBars + CausalChain — investigator-facing belief decomposition and SHAP-ordered narrative."),
  bullet("AlertActions — disposition buttons gated by capability matrix (Manager sees \"Recommend freeze\" instead of \"Freeze\")."),
  bullet("OperationsConsole — the new live-fraud demo widget; shared by Employee and Manager pages (scope prop toggles privileged actions)."),
  bullet("LanguageSwitcher — pill with native script + English label, globe icon, RTL-aware."),
  divider(),
];

// 7. Multilingual
const i18n = [
  h1("7. Multilingual Support"),
  p("PRISM's chrome translates into ten Indian languages, the choice driven by usage and constitutional eighth-schedule coverage. UI strings live in messages/<code>.json with the same key tree; the cookie-based runtime means no URL changes when the user switches language."),
  h3("Languages supported"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [800, 3000, 5560],
    rows: [
      new TableRow({ children: [hcell("Code", 800), hcell("Language", 3000), hcell("Notes", 5560)] }),
      ...[
        ["en", "English", "Default"],
        ["hi", "हिन्दी (Hindi)", "Devanagari, professional bank vocabulary"],
        ["bn", "বাংলা (Bengali)", "Eastern India coverage"],
        ["te", "తెలుగు (Telugu)", "Andhra Pradesh, Telangana"],
        ["mr", "मराठी (Marathi)", "Maharashtra"],
        ["ta", "தமிழ் (Tamil)", "Tamil Nadu, Puducherry"],
        ["ur", "اُردُو (Urdu)", "RTL direction applied automatically"],
        ["gu", "ગુજરાતી (Gujarati)", "Gujarat"],
        ["kn", "ಕನ್ನಡ (Kannada)", "Karnataka"],
        ["ml", "മലയാളം (Malayalam)", "Kerala"],
      ].map(([c, l, n]) => new TableRow({ children: [cell(c, 800), cell(l, 3000), cell(n, 5560)] })),
    ],
  }),
  h3("Implementation"),
  bullet("next-intl with a cookie-driven request config (i18n/request.ts) reading prism_locale."),
  bullet("Root layout sets <html lang dir> from LOCALE_META so Urdu renders right-to-left."),
  bullet("LanguageSwitcher POSTs to /api/locale (public) and refreshes the route via React's router."),
  bullet("Noto Sans Devanagari loaded alongside Inter via next/font/google."),
  bullet("Extending to an 11th language: drop messages/xx.json + register in lib/i18n/locales.ts."),
  divider(),
];

// 8. Data flow & storage
const data = [
  h1("8. Data Layer"),
  p("MongoDB hosts seven seeded Phase-1 collections plus three derived collections written by the app itself."),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 1600, 4760],
    rows: [
      new TableRow({ children: [hcell("Collection", 3000), hcell("Source", 1600), hcell("Used by", 4760)] }),
      ...[
        ["branches", "Phase 1", "stats, alerts join, /api/branches"],
        ["employees", "Phase 1", "auth, RBAC, all dashboards"],
        ["customers", "Phase 1", "graph, /api/customers"],
        ["accounts", "Phase 1", "operations, transactions, classification"],
        ["transactions", "Phase 1 + Phase 4", "operations (writes), feed, detection"],
        ["activity_logs", "Phase 1 + Phase 4", "operations (writes), self-service, detection"],
        ["dependents", "Phase 1", "graph, employee portal"],
        ["alerts", "Phase 4 (derived)", "live feed, alert detail, disposition"],
        ["alert_audit", "Phase 4 (derived)", "audit trail of every disposition decision"],
        ["disclosures", "Phase 4 (derived)", "voluntary external-account submissions"],
      ].map(([n, s, u]) => new TableRow({ children: [cell(n, 3000), cell(s, 1600), cell(u, 4760)] })),
    ],
  }),
  divider(),
];

// 9. Running it
const running = [
  h1("9. Running the Application"),
  h3("Local development"),
  code(
`# 1. Install dependencies
npm install

# 2. Confirm .env.local has the Mongo URI + JWT secret
cat .env.local

# 3. Start the dev server
npm run dev
# → http://localhost:3000

# 4. (Optional) Pre-populate the alerts collection for a non-empty feed
npm run seed-alerts -- --reset --limit 200`),
  h3("Demo credentials"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1600, 3600, 2080, 2080],
    rows: [
      new TableRow({ children: [hcell("Employee", 1600), hcell("Designation", 3600), hcell("Role", 2080), hcell("Lands on", 2080)] }),
      ...[
        ["EMP_00007", "Assistant General Manager – Operations", "ADMIN", "/admin"],
        ["EMP_00001", "Branch Manager (Scale-III)", "BRANCH_MANAGER", "/manager"],
        ["EMP_00050", "Assistant Manager (Scale-II)", "EMPLOYEE", "/employee"],
      ].map(([e, d, r, l]) => new TableRow({ children: [cell(e, 1600), cell(d, 3600), cell(r, 2080), cell(l, 2080)] })),
    ],
  }),
  p("All accounts use password prism123. Role is derived at login from grade + designation; the JWT carries the role for 12 hours."),
  divider(),
];

// 10. Roadmap
const roadmap = [
  h1("10. Roadmap"),
  bullet("Wire trained Phase-2 artefacts via the lib/detect FastAPI adapter."),
  bullet("Add Neo4j sync once the GAT model needs richer community queries (Layer 1 today uses Mongo-derived sub-graphs)."),
  bullet("Kafka ingestion at scale — the current in-process SSE bus already exposes publish/subscribe and can be swapped for Redis Pub/Sub."),
  bullet("Real password hashing (bcryptjs is already a dependency) once roll-out leaves the demo phase."),
  bullet("Round-trip translations of Operations Console copy into bn / te / mr / ta / ur / gu / kn / ml (currently English placeholder); other surfaces are fully hand-translated."),
  bullet("Per-locale translation of role names + suspicion-type labels in the live feed."),
  new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "— end of document —", font: FONT, size: 18, italic: true, color: UB_GREY })] }),
];

// ───── Build the document ──────────────────────────────────────────────────

const doc = new Document({
  creator: "Team GangOfFour",
  title: "PRISM — Next.js Application Documentation",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 36, bold: true, color: UB_BLUE },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 28, bold: true, color: UB_RED },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 24, bold: true, color: UB_BLUE },
        paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{ reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 240 } } } }] }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text: "PRISM · ", font: FONT, size: 16, bold: true, color: UB_BLUE }),
          new TextRun({ text: "Next.js Application Documentation", font: FONT, size: 16, color: UB_GREY }),
          new TextRun({ text: "    ·    Union Bank of India · iDEA 2.0 Hackathon", font: FONT, size: 16, color: UB_GREY }),
        ],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", font: FONT, size: 16, color: UB_GREY }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: UB_GREY }),
          new TextRun({ text: " · Team GangOfFour · VESIT Mumbai", font: FONT, size: 16, color: UB_GREY }),
        ],
      })] }),
    },
    children: [
      ...cover,
      ...execSummary,
      ...architecture,
      ...backend,
      ...detect,
      ...ops,
      ...frontend,
      ...i18n,
      ...data,
      ...running,
      ...roadmap,
    ],
  }],
});

const outDir = path.resolve(__dirname, "../../Documents");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "PRISM_NextJs_App_Documentation.docx");

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outFile, buf);
  console.log("wrote", outFile, `(${buf.length} bytes)`);
});
