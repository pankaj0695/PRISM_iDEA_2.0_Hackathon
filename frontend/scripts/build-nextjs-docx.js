// Regenerates PRISM_NextJs_App_Documentation.docx
// Reflects the ACTUAL frontend status (Phase 3 + 4 built, mock detector active)
// and the concrete plan to integrate the three deployed Cloud Run ML APIs.
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, HeadingLevel, PageNumber,
} = require("docx");

const UB_RED = "E30613";
const UB_BLUE = "003B71";
const UB_GREY = "5A6A82";
const GREEN = "15803D";
const AMBER = "B45309";
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" };
const CELL = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const FONT = "Arial";
const MONO = "Consolas";

const p = (text, o = {}) => new Paragraph({
  spacing: { after: 80, ...(o.spacing || {}) },
  children: [new TextRun({ text, font: FONT, size: 22, ...(o.run || {}) })],
});
const h1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: UB_BLUE, space: 6 } },
  spacing: { after: 140, before: 120 },
  children: [new TextRun({ text: t, font: FONT, size: 34, bold: true, color: UB_BLUE })],
});
const h2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 },
  children: [new TextRun({ text: t, font: FONT, size: 27, bold: true, color: UB_RED })],
});
const h3 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 60 },
  children: [new TextRun({ text: t, font: FONT, size: 23, bold: true, color: UB_BLUE })],
});
const bullet = (text, o = {}) => new Paragraph({
  numbering: { reference: "b", level: 0 }, spacing: { after: 40 },
  children: [new TextRun({ text, font: FONT, size: 22, ...(o.run || {}) })],
});
const code = (text) => new Paragraph({
  spacing: { after: 100, before: 20 }, shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
  children: text.split("\n").map((ln, i) =>
    new TextRun({ text: ln, font: MONO, size: 17, break: i === 0 ? 0 : 1 })),
});
const tag = (text, color) => new TextRun({ text, font: FONT, size: 22, bold: true, color });

function hc(label, w) {
  return new TableCell({
    borders: CELL, width: { size: w, type: WidthType.DXA },
    shading: { fill: UB_BLUE, type: ShadingType.CLEAR },
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    children: [new Paragraph({ children: [new TextRun({ text: label, font: FONT, size: 19, bold: true, color: "FFFFFF" })] })],
  });
}
function c(text, w, o = {}) {
  o = o || {};
  const runs = [new TextRun({ text: String(text), font: o.mono ? MONO : FONT, size: o.mono ? 17 : 19, color: o.color || "0A1F3A", bold: !!o.bold })];
  return new TableCell({
    borders: CELL, width: { size: w || 3000, type: WidthType.DXA },
    shading: o.shade ? { fill: o.shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({ children: runs })],
  });
}
const row = (cells) => new TableRow({ children: cells });
function table(widths, header, rows) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [row(header.map((h, i) => hc(h, widths[i]))), ...rows],
  });
}

const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 60 },
    children: [tag("यूनियन बैंक  ·  Union Bank of India", UB_RED)] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: "iDEA 2.0 Hackathon  ·  Team GangOfFour  ·  VESIT Mumbai", font: FONT, size: 18, color: UB_GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "PRISM", font: FONT, size: 78, bold: true, color: UB_BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Privileged-user Risk Identification & Surveillance Monitoring", font: FONT, size: 23, bold: true, color: UB_RED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [new TextRun({ text: "Next.js Application — Status & ML Integration Plan", font: FONT, size: 26, bold: true, color: "0A1F3A" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 60 },
    children: [new TextRun({ text: "Frontend (Phase 3 + 4): BUILT · ML APIs: DEPLOYED · Wiring: PLANNED", font: FONT, size: 20, color: UB_GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Version 2.0  ·  May 2026", font: FONT, size: 18, color: UB_GREY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Pankaj Gupta  ·  Chinmay Desai  ·  Harshavardhan Khamkar  ·  Aanchal Gupta", font: FONT, size: 18, color: UB_GREY })] }),
];

const s1 = [
  new Paragraph({ heading: HeadingLevel.HEADING_1,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: UB_BLUE, space: 6 } },
    spacing: { after: 140 },
    children: [new TextRun({ text: "1. Executive Summary", font: FONT, size: 34, bold: true, color: UB_BLUE })] }),
  p("This document records the current state of the PRISM Next.js web application and lays out exactly how it will be wired to the three machine-learning microservices that are now live on Google Cloud Run."),
  p("Two facts frame everything below:"),
  bullet("The frontend is complete. All three role-aware dashboards, the live Operations Console, the relationship graph, the What-If simulator, real-time alerting, ten-language localisation and the full RBAC/auth layer are built and working against MongoDB."),
  bullet("The intelligence is deployed but not yet connected. Layer 1 (Graph Neural Network), Layer 2 (Behavioural Ensemble + SHAP) and the Layer 3 Dempster-Shafer fusion orchestrator are all live and healthy on Cloud Run. The app currently scores events with a deterministic mock detector behind a single swappable seam (lib/detect/). Replacing the mock with the real models is a contained, low-risk change."),
  h3("Headline status"),
  table([3400, 1500, 4460],
    ["Component", "Status", "Notes"],
    [
      row([c("Synthetic dataset (7 collections)"), c("COMPLETE", 1500, { color: GREEN, bold: true }), c("73,669 records in MongoDB (mongo.chinmaydesai.xyz/PRISM)")]),
      row([c("ML models on Cloud Run (L1 / L2 / L3)"), c("DEPLOYED", 1500, { color: GREEN, bold: true }), c("All three HTTPS services healthy in asia-south1")]),
      row([c("Next.js backend (APIs, JWT/RBAC, SSE)"), c("BUILT", 1500, { color: GREEN, bold: true }), c("Reads/writes MongoDB directly")]),
      row([c("Three dashboards + Operations Console + i18n"), c("BUILT", 1500, { color: GREEN, bold: true }), c("Admin, Manager, Employee; 10 Indian languages")]),
      row([c("Detection source"), c("MOCK", 1500, { color: AMBER, bold: true }), c("lib/detect/mockDetector.ts — ready to swap to live ML")]),
      row([c("Live ML wiring", undefined, { bold: true }), c("PLANNED", 1500, { color: UB_RED, bold: true }), c("This document — Section 4 onward")]),
    ]),
];

const s2 = [
  h1("2. Current Frontend Status (What Is Built)"),
  p("The application is a single Next.js 16 (App Router, TypeScript, Tailwind v4) project. Everything below is implemented and runs today against MongoDB."),
  h3("2.1 Dashboards & pages"),
  table([2600, 6860],
    ["Area", "Pages / capabilities (all live)"],
    [
      row([c("Admin / Fraud Analyst", undefined, { bold: true }), c("/admin (KPI strip, live alert feed, severity trend) · /admin/alerts (severity-filtered queue) · /admin/alerts/[id] (belief-mass bars, causal chain, disposition) · /admin/graph (React Flow network) · /admin/whatif")]),
      row([c("Branch Manager / Compliance", undefined, { bold: true }), c("/manager (branch-scoped queue) · /manager/operations (live actions) · /manager/alerts + [id] (disposition, recommend-freeze) · /manager/whatif")]),
      row([c("Employee", undefined, { bold: true }), c("/employee (self-service home) · /employee/operations (live actions) · /employee/activity (logs, logins, devices) · /employee/disclosure")]),
      row([c("Auth", undefined, { bold: true }), c("/login (UB-themed, 10-language) · JWT cookie · role auto-derived from grade + designation · middleware route-gating")]),
    ]),
  h3("2.2 Backend API routes (Next.js, already built)"),
  table([3600, 5860],
    ["Route", "Purpose"],
    [
      row([c("/api/auth/login | logout | me", undefined, { mono: true }), c("JWT cookie session; role from grade + designation")]),
      row([c("/api/operations", undefined, { mono: true }), c("Execute a live banking action → classify → detect → persist alert → SSE push")]),
      row([c("/api/detect/run | /whatif", undefined, { mono: true }), c("Calls lib/detect.runDetection() — the ML seam")]),
      row([c("/api/alerts | /[id] | /[id]/disposition", undefined, { mono: true }), c("List, detail, and confirm/dismiss/escalate/freeze + audit")]),
      row([c("/api/graph/network", undefined, { mono: true }), c("Nodes + edges for the React Flow relationship graph")]),
      row([c("/api/realtime", undefined, { mono: true }), c("Server-Sent Events stream (alert.new / alert.updated)")]),
      row([c("/api/stats/overview | /severity-trend", undefined, { mono: true }), c("KPI counts and the severity trend chart")]),
      row([c("/api/me/activity | /disclosure, /api/locale", undefined, { mono: true }), c("Self-service portal data and language switch")]),
      row([c("/api/{collection}", undefined, { mono: true }), c("branches, employees, customers, accounts, transactions, activity-logs, dependents")]),
    ]),
  h3("2.3 The detection seam (the one place ML plugs in)"),
  p("All scoring flows through lib/detect/. The public function never changes; only the detector behind it does:"),
  code(
`// lib/detect/index.ts  (already in the codebase)
export function getDetector(): Detector {
  const choice = (process.env.DETECTOR || "mock").toLowerCase();
  if (choice === "mock")   return mockDetector;     // <- active today
  // if (choice === "layer3") return layer3Detector; // <- to be added
  return mockDetector;
}
export async function runDetection(req) { return getDetector().run(req); }`),
  p("Because the Operations Console, What-If simulator, alert feed and alert detail all consume runDetection() (directly or via the alert documents it produces), switching DETECTOR from “mock” to “layer3” upgrades every one of those surfaces at once — with no UI or route changes."),
  h3("2.4 Other built capabilities"),
  bullet("Multilingual UI in 10 Indian languages (en, hi, bn, te, mr, ta, ur with RTL, gu, kn, ml) via next-intl; cookie-persisted."),
  bullet("Union Bank visual identity: red/blue/yellow palette, bilingual Hindi/English brand lockup."),
  bullet("Live alert feed over SSE; disposition workflow with audit trail; KPI strip; severity-trend chart."),
];

const s3 = [
  h1("3. The Deployed ML Services"),
  p("Three independent FastAPI services run on Google Cloud Run (region asia-south1). All three were probed live and returned healthy. Critically, all three read the SAME MongoDB the frontend uses (mongo.chinmaydesai.xyz / database PRISM) — so the models see exactly the data our app writes."),
  h3("3.1 Service base URLs"),
  table([2300, 7160],
    ["Service", "Base URL"],
    [
      row([c("Layer 1 — GNN", undefined, { bold: true }), c("https://layer1-fastapi-660444655892.asia-south1.run.app", undefined, { mono: true })]),
      row([c("Layer 2 — Ensemble + SHAP", undefined, { bold: true }), c("https://prism-layer2-api-660444655892.asia-south1.run.app", undefined, { mono: true })]),
      row([c("Layer 3 — DS Fusion (final)", undefined, { bold: true }), c("https://prism-final-layer-660444655892.asia-south1.run.app", undefined, { mono: true })]),
    ]),
  h3("3.2 Layer 3 — Fusion Orchestrator (the primary integration target)"),
  p("Layer 3 calls Layer 1 + Layer 2 in parallel, fuses them with Dempster-Shafer, and returns one combined verdict. Routes are prefixed /api/v1/prism:"),
  table([3550, 5910],
    ["Route", "Returns / use"],
    [
      row([c("POST /analyze/{employee_id}", undefined, { mono: true }), c("THE big one — combined_result {risk_level, belief_masses, conflict_score, label}, layer1, layer2, risk_signals (15 booleans), causal_chain {narrative, top_features[]}, metadata. Auto-fetches the 30-day window from MongoDB, or accepts it inline.")]),
      row([c("GET /score/{employee_id}", undefined, { mono: true }), c("Layer-1-only cached belief masses + community + risk_level")]),
      row([c("GET /suspicious?threshold=&limit=", undefined, { mono: true }), c("Ranked suspicious-employee list (prefer Layer 1 directly — see caveats)")]),
      row([c("GET /community/{id}", undefined, { mono: true }), c("Louvain community fraud-rate + members")]),
      row([c("POST /batch", undefined, { mono: true }), c("Analyze many employees at once (demo seeding)")]),
      row([c("GET /health · POST /refresh", undefined, { mono: true }), c("Upstream status · rebuild Layer 1 cache")]),
    ]),
  h3("3.3 Layer 1 — Graph Neural Network (prefix /api/v1/layer1)"),
  p("Scores all 400 employees once at startup and serves from an in-memory cache — every read is instant. Verified live: 400 employees scored, with a CRITICAL/HIGH/WATCH/CLEAR breakdown, graph of ~6,900 nodes / ~13,700 edges."),
  table([3550, 5910],
    ["Route", "Returns / use"],
    [
      row([c("GET /score/{employee_id}", undefined, { mono: true }), c("gnn_fraud_prob, belief_masses, community, risk_level")]),
      row([c("GET /suspicious?threshold=&limit=", undefined, { mono: true }), c("Top suspicious employees (powers the Admin triage list)")]),
      row([c("GET /community/{community_id}", undefined, { mono: true }), c("Community members + fraud_rate (powers graph colouring)")]),
      row([c("POST /analyze", undefined, { mono: true }), c("Batch scores for a list of employee IDs")]),
    ]),
  h3("3.4 Layer 2 — Behavioural Ensemble + SHAP (prefix /api/v1/layer2)"),
  p("POST /analyze takes 30 days of one employee's transactions + activity logs and returns a fraud/normal label, confidence, the XGBoost/LightGBM/IsolationForest scores, a SHAP causal-chain narrative and 15 boolean risk signals. Verified live: an inline FD-break scenario returned FRAUD, confidence 1.0, CRITICAL in ~0.3s (warm)."),
  p("VERIFIED CONTRACT MATCH: the API risk levels are exactly CRITICAL / HIGH / WATCH / CLEAR — identical to the enum the frontend already renders. Belief masses use m_fraud / m_legit / m_uncertain (the UI uses fraud / legitimate / uncertain) — a one-line field rename bridges them."),
];

const s4 = [
  h1("4. Which API Powers Which Frontend Feature"),
  p("Every frontend surface falls into one of three buckets: powered by the live ML APIs, kept local (no API exists), or a brand-new capability the APIs unlock."),
  h3("4.1 Becomes live via the ML APIs"),
  table([2900, 3300, 3260],
    ["Frontend feature", "Backed by", "Mapping notes"],
    [
      row([c("Alert detail — 3 belief-mass bars"), c("L3 /analyze → combined + layer1 + layer2", 3300), c("m_fraud→fraud, etc. Bars already match")]),
      row([c("Severity badge + risk score"), c("L3 combined_result.risk_level", 3300), c("Enum identical — no mapping")]),
      row([c("Causal chain (SHAP narrative)"), c("L3 causal_chain.top_features[]", 3300), c("Richer than the mock; drop chain_probability")]),
      row([c("What-If simulator"), c("L3 /analyze with inline window", 3300), c("Natural fit; returns real model verdict")]),
      row([c("Operations Console verdict"), c("L3 /analyze after the action is written", 3300), c("Keep instant local rule check, then call ML")]),
      row([c("Live alert feed content"), c("L3 result → our alert document", 3300), c("Transport stays SSE; payload becomes real")]),
    ]),
  h3("4.2 New capabilities the APIs unlock (worth adding)"),
  table([2900, 3300, 3260],
    ["New feature", "Backed by", "Where it goes"],
    [
      row([c("Risk Signals panel (15 flags)"), c("L3 / L2 risk_signals", 3300), c("Alert detail — new panel")]),
      row([c("Top Suspicious Employees"), c("L1 /suspicious", 3300), c("Admin overview — new card")]),
      row([c("Graph nodes coloured by GNN risk"), c("L1 /score + /community", 3300), c("Relationship graph")]),
      row([c("Community risk inspector"), c("L1 /community/{id}", 3300), c("Graph side panel")]),
      row([c("ML service health pill"), c("/health × 3", 3300), c("Admin header strip")]),
    ]),
  h3("4.3 Stays local / simulated (no API exists — by design)"),
  bullet("Real-time transport (SSE) — the APIs are request/response; our in-process SSE bus stays and is triggered after each ML call."),
  bullet("Alert disposition + audit trail (confirm / dismiss / escalate / freeze) — no write-back endpoint; stays in our MongoDB."),
  bullet("All collection browsing (employees, accounts, transactions, etc.) — the ML layer is detection-only, not a data API."),
  bullet("Auth / login / RBAC, KPI counts, severity-trend chart, voluntary disclosure, my-activity — all our own data and logic."),
  bullet("Operations Console instant verdict — the rule classifier stays for sub-second feedback; the ML call enriches it a moment later."),
];

const s5 = [
  h1("5. Integration Plan — How the Frontend Connects"),
  h3("5.1 Architecture: server-side proxy"),
  p("The browser never calls Cloud Run directly. Every ML call is made from our Next.js server (API routes / the detect seam). This keeps backend URLs and any API key server-side, preserves our JWT/RBAC, lets us assemble the request from MongoDB, write the resulting alert to our DB, push it over SSE, and map the response shape in exactly one place."),
  code(
`Browser -> Next.js /api/* (RBAC, our Mongo, SSE)
                 |
                 |  server-side fetch (lib/backend/clients.ts)
                 v
   +-------------+---------------+----------------+
   v             v               v                v
 Layer 1 GNN   Layer 2 Ens.    Layer 3 Fusion   /health x3
 /score        /analyze        /analyze/{id}
 /suspicious                   (calls L1+L2)
 /community`),
  h3("5.2 New files"),
  table([3200, 6260],
    ["File", "Responsibility"],
    [
      row([c("lib/backend/clients.ts", undefined, { mono: true }), c("Typed fetchers for L1 / L2 / L3 with timeouts, retry on cold start, and a cached /health probe")]),
      row([c("lib/detect/layer3Detector.ts", undefined, { mono: true }), c("New Detector: assemble the employee's 30-day window from MongoDB → POST L3 /analyze/{id} → map response to our DetectionResult (belief masses, severity, causal chain, + risk_signals)")]),
      row([c("app/api/intel/suspicious/route.ts", undefined, { mono: true }), c("RBAC-guarded proxy → Layer 1 /suspicious")]),
      row([c("app/api/intel/score/[employeeId]/route.ts", undefined, { mono: true }), c("Proxy → Layer 1 /score/{id}")]),
      row([c("app/api/intel/community/[id]/route.ts", undefined, { mono: true }), c("Proxy → Layer 1 /community/{id}")]),
      row([c("app/api/intel/health/route.ts", undefined, { mono: true }), c("Aggregated health of all three services")]),
    ]),
  h3("5.3 Edited files"),
  table([3200, 6260],
    ["File", "Change"],
    [
      row([c("lib/detect/index.ts", undefined, { mono: true }), c("getDetector(): add the ‘layer3’ branch returning layer3Detector")]),
      row([c(".env.local", undefined, { mono: true }), c("Add LAYER1_URL, LAYER2_URL, FINAL_URL, optional PRISM_API_KEY, and set DETECTOR=layer3")]),
      row([c("lib/db/schemas.ts (Alert)", undefined, { mono: true }), c("Add optional risk_signals + conflict_score fields")]),
      row([c("components/alerts/AlertDetail", undefined, { mono: true }), c("Add a Risk Signals panel; show real SHAP top_features; hide chain_probability")]),
      row([c("app/(admin)/admin/page.tsx", undefined, { mono: true }), c("Add the Top Suspicious Employees card (fed by /api/intel/suspicious)")]),
      row([c("components/graph/RelationshipGraph", undefined, { mono: true }), c("Colour employee nodes by GNN m_fraud via /api/intel/score")]),
      row([c("components/ub/UnionBankHeader", undefined, { mono: true }), c("Optional ML-services health pill via /api/intel/health")]),
    ]),
  h3("5.4 The response mapping (single source of truth)"),
  code(
`// inside lib/detect/layer3Detector.ts
combined_result.risk_level            -> DetectionResult.severity
combined_result.belief_masses         -> fused  {fraud, legitimate, uncertain}
layer1.belief_masses                  -> layer1 {fraud, legitimate, uncertain}
layer2.bpa_used                       -> layer2 {fraud, legitimate, uncertain}
combined_result.belief_masses.m_fraud -> risk_score
causal_chain.narrative                -> causal_chain_text
causal_chain.top_features[]           -> causal_chain[] (feature, shap, description)
risk_signals (15 booleans)            -> alert.risk_signals  (NEW panel)
metadata.inference_time_ms            -> alert meta`),
  h3("5.5 The live-fraud demo path (end to end)"),
  bullet("Employee/Manager executes an action in the Operations Console → /api/operations."),
  bullet("We write the activity log (and transaction) to MongoDB and run the instant local rule check (sub-second red/green)."),
  bullet("We call runDetection() which (with DETECTOR=layer3) hits L3 /analyze/{employee_id}; because all services share our MongoDB, the model sees the just-written event."),
  bullet("We persist the returned alert and publish it over SSE; the Admin live feed lights up within a second with the real model verdict, belief masses, SHAP narrative and risk signals."),
  p("Verified building block: an inline FD-break window sent to Layer 2 returned FRAUD / confidence 1.0 / CRITICAL with a full SHAP narrative — so this path produces a genuine CRITICAL alert, not a scripted one."),
];

const s6 = [
  h1("6. Caveats & Demo-Day Operations"),
  h3("6.1 Things to handle in code"),
  bullet("Field rename: API uses m_fraud / m_legit / m_uncertain and risk_level; the UI uses fraud / legitimate / uncertain and severity. Handled once in layer3Detector.ts."),
  bullet("chain_probability: the APIs do not return it. Hide that line in the causal-chain UI, or derive it from conflict_score."),
  bullet("Triage list: the final layer's /suspicious returned 0 in testing (stale proxy cache) while Layer 1's own /suspicious returned real results — call Layer 1 directly for the Top Suspicious card."),
  bullet("Cold start: Cloud Run scales to zero. Layer 2's first call after idle took ~10s (then ~0.3s warm). Add a loading state and pre-warm before the demo."),
  h3("6.2 Demo-day checklist"),
  bullet("Pre-warm all three services (curl each /health, or POST /refresh on Layer 1 and Layer 3) right before judging."),
  bullet("Optionally set Cloud Run --min-instances=1 on Layer 2 and Layer 3 to remove cold-start latency entirely."),
  bullet("Pre-compute demo state: call L3 /batch (or /analyze) for the chosen demo employees so the feed and triage list are populated instantly."),
  bullet("Keep DETECTOR=mock as a one-line fallback: if the network or a service misbehaves mid-demo, flip back to the mock and every screen keeps working."),
  h3("6.3 Risk assessment"),
  p("Low. The integration touches one new detector module, one config switch, four thin proxy routes and a handful of additive UI panels. No existing route, schema or component is removed. The mock detector remains as an instant rollback. The contract (risk levels, belief masses, causal chain, risk signals) already matches what the UI renders, so the surface area of change is small and reversible."),
  new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "— end of document —", font: FONT, size: 18, italic: true, color: UB_GREY })] }),
];

const doc = new Document({
  creator: "Team GangOfFour",
  title: "PRISM — Next.js App Status & ML Integration Plan",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 34, bold: true, color: UB_BLUE }, paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 27, bold: true, color: UB_RED }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 23, bold: true, color: UB_BLUE }, paragraph: { spacing: { before: 150, after: 60 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 240 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: { default: new Header({ children: [new Paragraph({
      children: [
        new TextRun({ text: "PRISM · ", font: FONT, size: 16, bold: true, color: UB_BLUE }),
        new TextRun({ text: "Next.js App Status & ML Integration Plan", font: FONT, size: 16, color: UB_GREY }),
        new TextRun({ text: "    ·    Union Bank of India · iDEA 2.0", font: FONT, size: 16, color: UB_GREY }),
      ] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Page ", font: FONT, size: 16, color: UB_GREY }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: UB_GREY }),
        new TextRun({ text: " · Team GangOfFour · VESIT Mumbai", font: FONT, size: 16, color: UB_GREY }),
      ] })] }) },
    children: [...cover, ...s1, ...s2, ...s3, ...s4, ...s5, ...s6],
  }],
});

const outFile = path.resolve(__dirname, "../../Documents/PRISM_NextJs_App_Documentation.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outFile, buf);
  console.log("wrote", outFile, `(${buf.length} bytes)`);
});
