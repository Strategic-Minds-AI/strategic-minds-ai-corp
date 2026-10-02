// Maps each generator category and registry entity to a live HTML preview
// showing what that generator produces in the real world. Reuses the same
// scoped .vg-screen mini-UI kit and brand tokens as the Visual Gallery.
import { DEFAULT_CONFIG } from "@/lib/gallery/studioConfig.js";

const FS = (n) => `font-size:calc(${n}px * var(--vg-font-scale,1))`;
const ctxd = (config) => ({ ...DEFAULT_CONFIG, ...config });

const logo = (ctx) => {
  if (ctx.logoImage) return `<span class="logo"><img src="${ctx.logoImage}" alt="" style="height:16px;width:auto;border-radius:4px;vertical-align:middle" /></span>`;
  const parts = String(ctx.logoText || "Strategic Minds").trim().split(/\s+/);
  if (parts.length < 2) return `<span class="logo">${parts[0] || ""}</span>`;
  const last = parts.pop();
  return `<span class="logo">${parts.join(" ")} <b>${last}</b></span>`;
};

const nav = (ctx, active, tabs = ["Dashboard", "Projects", "Reports"]) =>
  `<div class="vg-nav">${logo(ctx)}${tabs.map((t) => `<span class="vg-tab ${t === active ? "on" : ""}">${t}</span>`).join("")}<div style="flex:1"></div><span class="vg-avatar"></span></div>`;

const BROWSER = { w: 760, h: 460 };

/* ---------- CATEGORY renderers ---------- */

function codeEditor(ctx) {
  const files = ["App.tsx", "api.ts", "schema.ts", "utils.ts", "test.ts"];
  const lines = [
    [7, "import { Router } from 'express';"],
    [0, ""],
    [7, "const app = Router();"],
    [0, ""],
    [3, "app.get('/health', (req, res) => {"],
    [14, "  return res.json({ ok: true });"],
    [3, "});"],
    [0, ""],
    [7, "export default app;"],
  ];
  return (
    nav(ctx, "Code", ["Code", "Tests", "Build"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px">${files.map((f, i) => `<div class="i ${i === 0 ? "on" : ""}" title="${f}">${f[0]}</div>`).join("")}</div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column">
        <div class="vg-row vg-gap2" style="padding:5px 10px;border-bottom:1px solid var(--brand-border);flex:none"><span class="vg-chip">App.tsx</span><span class="vg-muted" style="${FS(8)}">12 lines</span><div style="flex:1"></div><span class="vg-chip soft">TypeScript</span></div>
        <div class="vg-scroll" style="flex:1;overflow:auto;padding:10px;font-family:var(--font-mono);${FS(10)};line-height:1.7">
          ${lines.map((l) => `<div style="display:flex;gap:10px"><span class="vg-muted" style="width:18px;text-align:right;opacity:.5">${l[0] + 1}</span><span style="color:${l[1].startsWith("import") ? "var(--brand-primary)" : l[1].includes("return") ? "var(--brand-gold-deep)" : "var(--brand-text)"}">${l[1] || "&nbsp;"}</span></div>`).join("")}
        </div>
      </div>
    </div>`
  );
}

function aiConsole(ctx) {
  const agents = [["Orchestrator", "Running", "12 runs"], ["RAG Engine", "Idle", "—"], ["Validator", "Running", "3 checks"]];
  const log = ["[10:24:01] orchestrator: dispatched generatePlan", "[10:24:03] validator: schema PASS", "[10:24:05] rag: retrieved 4 chunks", "[10:24:08] orchestrator: run #441 complete"];
  return (
    nav(ctx, "Agents", ["Agents", "Runs", "Logs"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
        ${agents.map((a) => `<div class="vg-card" style="margin-bottom:7px;display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:rgba(0,89,255,.12);color:var(--brand-gold-deep);display:flex;align-items:center;justify-content:center"><span style="${FS(12)}">◍</span></div><div style="flex:1;min-width:0"><div style="${FS(10)};font-weight:700">${a[0]}</div><div class="vg-muted" style="${FS(8)}">${a[2]}</div></div><span class="vg-chip ${a[1] === "Running" ? "" : "soft"}">${a[1]}</span></div>`).join("")}
      </div>
      <div style="flex:1.1;min-width:0;border-left:1px solid var(--brand-border);padding:10px" class="vg-scroll">
        <div style="${FS(10)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin-bottom:6px">Live log</div>
        <div style="font-family:var(--font-mono);${FS(9)};line-height:1.6">${log.map((l) => `<div style="color:var(--brand-muted-foreground)">${l.replace(/([a-z]+):/, '<span style="color:var(--brand-primary);font-weight:700">$1:</span>')}</div>`).join("")}</div>
      </div>
    </div>`
  );
}

function businessDashboard(ctx) {
  const bars = [38, 52, 44, 61, 55, 72, 68, 80, 74, 88, 82, 95].map((h) => `<i style="height:${h}%"></i>`).join("");
  return (
    nav(ctx, "Dashboard") +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div class="vg-row vg-between" style="margin-bottom:10px"><div class="vg-col"><div style="${FS(14)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(9)}">${ctx.subtitle}</div></div><button class="vg-btn pri">+ New</button></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div class="vg-kpi"><div class="v">$48.2k</div><div class="l">Revenue</div></div>
        <div class="vg-kpi"><div class="v">1,284</div><div class="l">Active</div></div>
        <div class="vg-kpi"><div class="v">96%</div><div class="l">Uptime</div></div>
      </div>
      <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:8px">Revenue trend</div><div class="vg-chart">${bars}</div></div>
    </div>`
  );
}

function consultingReport(ctx) {
  const dims = [["Strategy", 4, "Optimized"], ["Operations", 3, "Managed"], ["Data", 2, "Defined"], ["AI", 3, "Managed"], ["Governance", 1, "Initial"]];
  return (
    nav(ctx, "Assessment", ["Report", "Findings", "Roadmap"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(9)};margin-top:2px">AI Readiness Assessment · Q4 2026</div>
      <div class="vg-card" style="margin-top:10px">
        ${dims.map((d) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:64px;${FS(9)};font-weight:700">${d[0]}</div><div style="flex:1;height:14px;background:var(--brand-muted);border-radius:6px;overflow:hidden"><div style="height:100%;width:${d[1] * 20}%;background:linear-gradient(90deg,var(--brand-gold-light),var(--brand-primary),var(--brand-gold-deep))"></div></div><div style="width:56px;text-align:right;${FS(8)};font-weight:700;color:var(--brand-primary)">${d[1]}/5</div><div style="width:56px;${FS(8)};color:var(--brand-muted-foreground)">${d[2]}</div></div>`).join("")}
      </div>
    </div>`
  );
}

function marketingCalendar(ctx) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const posts = [[0, "Blog: AI Trends", "blog"], [1, "Reel: Demo", "social"], [2, "Email: Launch", "email"], [3, "Webinar", "event"], [1, "Tweet thread", "social"], [4, "Case study", "blog"]];
  const tag = (t) => ({ blog: "var(--brand-primary)", social: "var(--brand-gold-bright)", email: "var(--brand-gold-deep)", event: "#0d9488" }[t] || "var(--brand-primary)");
  return (
    nav(ctx, "Calendar", ["Calendar", "Campaigns", "Analytics"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-row" style="border-bottom:1px solid var(--brand-border);flex:none">${days.map((d) => `<div style="flex:1;padding:7px;text-align:center;${FS(9)};font-weight:700;border-right:1px solid var(--brand-border)">${d}</div>`).join("")}</div>
      <div style="flex:1;display:flex;min-height:0">
        ${days.map((_, di) => `<div style="flex:1;border-right:1px solid var(--brand-border);padding:6px;overflow:hidden">${posts.filter((p) => p[0] === di).map((p) => `<div style="background:${tag(p[2])}22;border-left:3px solid ${tag(p[2])};color:var(--brand-text);border-radius:6px;padding:5px 7px;margin-bottom:5px;${FS(8)};font-weight:700">${p[1]}</div>`).join("")}</div>`).join("")}
      </div>
    </div>`
  );
}

function dataPipeline(ctx) {
  const stages = [["Extract", "4 sources", 85], ["Transform", "12 rules", 72], ["Load", "3 sinks", 90], ["Serve", "API + BI", 60]];
  return (
    nav(ctx, "Pipeline", ["Pipeline", "Schema", "Quality"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(9)};margin-top:2px">ETL Pipeline · 4 stages</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:14px">
        ${stages.map((s, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;${FS(13)}">${i + 1}</div><div style="${FS(9)};font-weight:700">${s[0]}</div><div class="vg-muted" style="${FS(8)}">${s[1]}</div><div class="vg-bar" style="width:100%"><i style="width:${s[2]}%"></i></div></div>${i < 3 ? `<div style="${FS(14)};color:var(--brand-primary);font-weight:900">→</div>` : ""}`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px">
        <div class="vg-kpi"><div class="v">2.4M</div><div class="l">Rows/day</div></div>
        <div class="vg-kpi"><div class="v">99.2%</div><div class="l">Quality</div></div>
        <div class="vg-kpi"><div class="v">4m</div><div class="l">Latency</div></div>
      </div>
    </div>`
  );
}

function infraMonitor(ctx) {
  const services = [["API Gateway", "Healthy", "99.9%"], ["Postgres", "Healthy", "99.8%"], ["Redis", "Degraded", "97.2%"], ["CDN", "Healthy", "100%"], ["Workers", "Healthy", "99.5%"]];
  const pill = (s) => `<span class="vg-chip ${s === "Healthy" ? "" : "soft"}" style="${s === "Degraded" ? "background:#fef3c7;color:#92400e" : ""}">${s}</span>`;
  return (
    nav(ctx, "Infra", ["Services", "Alerts", "Deploy"]) +
    `<div class="vg-scroll" style="flex:1;overflow:auto">
      <div class="vg-table"><div class="h"><span>Service</span><span>Status</span><span>Uptime</span><span>Latency</span></div>
        ${services.map((s) => `<div class="r"><span>${s[0]}</span><span>${pill(s[1])}</span><span class="vg-muted">${s[2]}</span><span>${(Math.random() * 40 + 12).toFixed(0)}ms</span></div>`).join("")}
      </div>
    </div>`
  );
}

function designSystem(ctx) {
  const swatches = ["#0059ff", "#0d2f96", "#3380ff", "#80b3ff", "#e6f0ff", "#f4f8ff"];
  return (
    nav(ctx, "Design", ["Tokens", "Components", "Patterns"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(9)}">Brand Design System</div>
      <div style="${FS(9)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin:12px 0 6px">Color palette</div>
      <div style="display:flex;gap:6px;margin-bottom:12px">${swatches.map((c) => `<div style="flex:1;height:36px;border-radius:8px;background:${c};border:1px solid var(--brand-border)"></div>`).join("")}</div>
      <div style="${FS(9)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin-bottom:6px">Typography</div>
      <div class="vg-card" style="margin-bottom:10px"><div style="${FS(20)};font-weight:900;line-height:1.1">Aa Heading</div><div style="${FS(11)};font-weight:600;margin-top:3px">Aa Subheading</div><div class="vg-muted" style="${FS(9)}">Aa Body text sample</div></div>
      <div style="display:flex;gap:8px"><button class="vg-btn pri">Primary</button><button class="vg-btn out">Outline</button><span class="vg-chip">Badge</span></div>
    </div>`
  );
}

function compoundScaffold(ctx) {
  return (
    nav(ctx, "Scaffold", ["Frontend", "API", "Database"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px"><div class="i on">▤</div><div class="i">◍</div><div class="i">◷</div><div class="i">⚙</div></div>
      <div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
        <div style="${FS(14)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(9)}">Fullstack Application Scaffold</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:5px">Frontend</div><div class="vg-muted" style="${FS(8)}">React · Tailwind · 14 screens</div><div class="vg-bar" style="margin-top:7px"><i style="width:80%"></i></div></div>
          <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:5px">API</div><div class="vg-muted" style="${FS(8)}">REST · 22 endpoints</div><div class="vg-bar" style="margin-top:7px"><i style="width:65%"></i></div></div>
          <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:5px">Database</div><div class="vg-muted" style="${FS(8)}">Postgres · 8 tables</div><div class="vg-bar" style="margin-top:7px"><i style="width:90%"></i></div></div>
          <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:5px">Auth</div><div class="vg-muted" style="${FS(8)}">OAuth · JWT · RBAC</div><div class="vg-bar" style="margin-top:7px"><i style="width:70%"></i></div></div>
        </div>
      </div>
    </div>`
  );
}

const CATEGORY_RENDERERS = {
  code: codeEditor,
  ai: aiConsole,
  business: businessDashboard,
  consulting: consultingReport,
  marketing: marketingCalendar,
  data: dataPipeline,
  infra: infraMonitor,
  design: designSystem,
  compound: compoundScaffold,
};

/* ---------- REGISTRY RECORD renderers ---------- */

function generatorDagView(ctx, record) {
  const dag = record?.definition?.workflow_dag || { nodes: [{ id: "validate_input", type: "validate_schema" }, { id: "render", type: "template" }, { id: "export", type: "export" }] };
  return (
    nav(ctx, "DAG", ["DAG", "Schema", "Policy"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${record?.name || "Generator"}</div><div class="vg-muted" style="${FS(9)}">${record?.generator_key || ""} · v${record?.version || "1.0.0"}</div>
      <div style="${FS(9)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin:12px 0 8px">Workflow DAG</div>
      <div class="vg-flow">${(dag.nodes || []).map((n, i) => `<div class="step ${i === 0 ? "on" : ""}"><div class="n">${i + 1}</div><div class="t">${n.id} <span class="vg-muted" style="${FS(8)}">· ${n.type}</span></div></div>`).join("")}</div>
      <div class="vg-card" style="margin-top:12px"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Validation gates</div><div class="vg-row vg-gap2" style="flex-wrap:wrap">${(record?.definition?.validation_policy?.mandatory || ["schema", "completeness", "secret_scan"]).map((m) => `<span class="vg-chip">${m}</span>`).join("")}</div></div>
    </div>`
  );
}

function policyView(ctx, record) {
  return (
    nav(ctx, "Policy", ["Rules", "Gates", "Audit"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${record?.name || "Policy"}</div><div class="vg-muted" style="${FS(9)}">${record?.policy_key || ""} · v${record?.version || "1.0.0"}</div>
      <div class="vg-card" style="margin-top:10px"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Approval gates</div><div class="vg-row vg-gap2" style="flex-wrap:wrap"><span class="vg-chip">READ</span><span class="vg-chip soft">DRAFT</span><span class="vg-chip soft">BRANCH_WRITE</span><span class="vg-chip soft">PROTECTED</span></div></div>
      <div class="vg-card" style="margin-top:8px"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Enforcement rules</div><div style="display:flex;flex-direction:column;gap:5px"><div style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:9999px;background:var(--brand-primary);display:flex;align-items:center;justify-content:center;color:#fff;${FS(8)};font-weight:900">✓</span><span style="${FS(9)}">All protected actions require admin approval</span></div><div style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:9999px;background:var(--brand-primary);display:flex;align-items:center;justify-content:center;color:#fff;${FS(8)};font-weight:900">✓</span><span style="${FS(9)}">Rollback window: 72 hours</span></div></div></div>
    </div>`
  );
}

function qualityView(ctx, record) {
  const gates = [["Schema", "PASS"], ["Completeness", "PASS"], ["Lint", "PASS"], ["Typecheck", "PASS"], ["Unit", "PASS"], ["Visual", "SKIP"]];
  return (
    nav(ctx, "Quality", ["Gates", "Guardrails", "History"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${record?.name || "Quality Profile"}</div><div class="vg-muted" style="${FS(9)}">${record?.profile_key || ""} · v${record?.version || "1.0.0"}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px">
        <div class="vg-kpi"><div class="v">12</div><div class="l">Pass gates</div></div>
        <div class="vg-kpi"><div class="v">3</div><div class="l">Aesthetic</div></div>
        <div class="vg-kpi"><div class="v">100%</div><div class="l">Coverage</div></div>
      </div>
      <div class="vg-card" style="margin-top:10px">${gates.map((g) => `<div class="vg-row vg-between" style="margin-bottom:5px"><span style="${FS(10)};font-weight:700">${g[0]}</span><span class="vg-chip ${g[1] === "PASS" ? "" : "soft"}">${g[1]}</span></div>`).join("")}</div>
    </div>`
  );
}

function validationView(ctx, record) {
  const layers = [["schema", "Mandatory"], ["completeness", "Mandatory"], ["lint", "Optional"], ["typecheck", "Mandatory"], ["unit", "Mandatory"], ["security", "Mandatory"], ["accessibility", "Optional"]];
  return (
    nav(ctx, "Validation", ["Layers", "Evidence", "Receipts"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${record?.name || "Validation Profile"}</div><div class="vg-muted" style="${FS(9)}">${record?.profile_key || ""} · v${record?.version || "1.0.0"}</div>
      <div class="vg-card" style="margin-top:10px">${layers.map((l) => `<div class="vg-row vg-between" style="margin-bottom:5px"><span style="${FS(10)};font-weight:700">${l[0]}</span><span class="vg-chip ${l[1] === "Mandatory" ? "" : "soft"}">${l[1]}</span></div>`).join("")}</div>
    </div>`
  );
}

function workflowView(ctx, record) {
  const def = record?.definition || {};
  const steps = def.steps || [{ key: "log_event", activity: "logFactoryEvent" }];
  return (
    nav(ctx, "Workflow", ["Steps", "Triggers", "Runs"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${record?.name || "Workflow"}</div><div class="vg-muted" style="${FS(9)}">${record?.workflow_key || ""} · v${record?.version || "1.0.0"}</div>
      <div class="vg-card" style="margin-top:8px"><div style="${FS(9)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin-bottom:5px">Trigger</div><span class="vg-chip">${def.trigger?.type || "entity"}</span> <span class="vg-muted" style="${FS(9)}">${def.trigger?.cron || def.trigger?.entity_name || ""}</span></div>
      <div style="${FS(9)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin:12px 0 6px">Steps</div>
      <div class="vg-flow">${steps.map((s, i) => `<div class="step ${i === 0 ? "on" : ""}"><div class="n">${i + 1}</div><div class="t">${s.key} <span class="vg-muted" style="${FS(8)}">· ${s.activity}</span></div></div>`).join("")}</div>
    </div>`
  );
}

function templatePackView(ctx, record) {
  const files = ["manifest.json", "variables.json", "README.md", "template.hbs", "schema.json"];
  return (
    nav(ctx, "Pack", ["Files", "Variables", "Export"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px">${files.map((f, i) => `<div class="i ${i === 0 ? "on" : ""}" title="${f}">${f[0].toUpperCase()}</div>`).join("")}</div>
      <div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
        <div style="${FS(14)};font-weight:900">${record?.name || "Template Pack"}</div><div class="vg-muted" style="${FS(9)}">${record?.template_key || ""} · v${record?.version || "1.0.0"}</div>
        <div class="vg-card" style="margin-top:10px"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Files in pack</div>${files.map((f) => `<div class="vg-row vg-gap2" style="margin-bottom:4px"><span style="${FS(9)};font-family:var(--font-mono)">${f}</span></div>`).join("")}</div>
      </div>
    </div>`
  );
}

function adapterView(ctx, record) {
  const conns = [["GitHub", "Connected", "repo"], ["Supabase", "Connected", "database"], ["Google Drive", "Connected", "drive"], ["Vercel", "Not configured", "deploy"]];
  const pill = (s) => `<span class="vg-chip ${s === "Connected" ? "" : "soft"}">${s}</span>`;
  return (
    nav(ctx, "Adapters", ["Connections", "Health", "Secrets"]) +
    `<div class="vg-scroll" style="flex:1;overflow:auto">
      <div class="vg-table"><div class="h"><span>Adapter</span><span>Status</span><span>Scope</span><span>Health</span></div>
        ${conns.map((c) => `<div class="r"><span>${c[0]}</span><span>${pill(c[1])}</span><span class="vg-muted">${c[2]}</span><span>${c[1] === "Connected" ? "●" : "○"}</span></div>`).join("")}
      </div>
    </div>`
  );
}

const REGISTRY_RENDERERS = {
  GeneratorDefinition: generatorDagView,
  PolicyDefinition: policyView,
  QualityProfile: qualityView,
  ValidationProfile: validationView,
  WorkflowDefinition: workflowView,
  TemplatePack: templatePackView,
  AdapterDefinition: adapterView,
  ProvisioningProfile: generatorDagView,
  RuntimeProfile: qualityView,
  ReleaseProfile: policyView,
  MonetizationProfile: businessDashboard,
};

/* ---------- AGENT renderers ---------- */

function agentMissionControl(ctx, agent) {
  const fleet = [["Growth", "Running"], ["Code", "Idle"], ["Social", "Running"], ["Sales", "Queued"], ["Brand", "Idle"], ["Replicator", "Paused"]];
  return (
    nav(ctx, "Mission", ["Fleet", "Tasks", "Brief"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
        <div style="${FS(14)};font-weight:900">${agent?.name || "Orchestrator"}</div><div class="vg-muted" style="${FS(9)}">Mission Control · Tier ${agent?.tier || 5}</div>
        <div class="vg-card" style="margin-top:8px"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Fleet status</div>${fleet.map((f) => `<div class="vg-row vg-between" style="margin-bottom:4px"><span style="${FS(10)};font-weight:700">${f[0]}</span><span class="vg-chip ${f[1] === "Running" ? "" : "soft"}" style="${f[1] === "Paused" ? "background:#fef3c7;color:#92400e" : ""}">${f[1]}</span></div>`).join("")}</div>
      </div>
      <div style="flex:1.1;min-width:0;border-left:1px solid var(--brand-border);padding:10px" class="vg-scroll">
        <div style="${FS(10)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin-bottom:6px">Mission brief</div>
        <div style="${FS(10)};line-height:1.5">${agent?.description || "Decompose goal → dispatch specialists → sequence critical path → track → escalate."}</div>
        <div class="vg-row vg-gap2" style="margin-top:10px;flex-wrap:wrap">${(agent?.skills || []).slice(0, 5).map((s) => `<span class="vg-chip">${s}</span>`).join("")}</div>
      </div>
    </div>`
  );
}

function agentGrowthDesk(ctx, agent) {
  return (
    nav(ctx, "Growth", ["SEO", "Search Console", "Analytics"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${agent?.name || "Growth Operator"}</div><div class="vg-muted" style="${FS(9)}">Google growth · SEO · indexing</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px">
        <div class="vg-kpi"><div class="v">42</div><div class="l">Keywords</div></div>
        <div class="vg-kpi"><div class="v">#3</div><div class="l">Avg rank</div></div>
        <div class="vg-kpi"><div class="v">98%</div><div class="l">Indexed</div></div>
      </div>
      <div class="vg-card" style="margin-top:10px"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Sitemap status</div><div class="vg-row vg-gap2" style="flex-wrap:wrap"><span class="vg-chip">submitted</span><span class="vg-chip soft">crawled</span><span class="vg-chip soft">indexed</span></div></div>
    </div>`
  );
}

function agentCrm(ctx, agent) {
  const deals = [["Acme Corp", "$48k", "Negotiation"], ["Northwind", "$22k", "Proposal"], ["Vertex", "$12k", "Qualified"], ["Blue Ocean", "$8k", "Lead"]];
  return (
    nav(ctx, "Pipeline", ["Leads", "Deals", "Reports"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="${FS(14)};font-weight:900">${agent?.name || "Sales Engine"}</div><div class="vg-muted" style="${FS(9)}">Lead gen · outreach · pipeline</div>
      <div class="vg-card" style="margin-top:10px">${deals.map((d) => `<div class="vg-row vg-between" style="margin-bottom:6px"><span style="${FS(10)};font-weight:700">${d[0]}</span><span style="${FS(10)};font-weight:900;color:var(--brand-primary)">${d[1]}</span><span class="vg-chip soft">${d[2]}</span></div>`).join("")}</div>
    </div>`
  );
}

const AGENT_RENDERERS = {
  orchestrator: agentMissionControl,
  growth_operator: agentGrowthDesk,
  code_architect: (ctx) => codeEditor(ctx),
  social_strategist: (ctx) => marketingCalendar(ctx),
  sales_engine: agentCrm,
  brand_guardian: (ctx) => designSystem(ctx),
  replicator: (ctx) => compoundScaffold(ctx),
  swarm: (ctx) => aiConsole(ctx),
};

/* ---------- ADAPTER renderers ---------- */

function fileManagerView(ctx) {
  const files = [["manifest.json", "cfg"], ["schema.sql", "sql"], ["README.md", "doc"], ["template.hbs", "tpl"], ["export.zip", "zip"]];
  const ic = (k) => ({ cfg: "⚙", sql: "▦", doc: "▤", tpl: "▤", zip: "📦" }[k] || "▤");
  return (
    nav(ctx, "Files", ["Files", "Recent", "Shared"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px"><div class="i on">▤</div><div class="i">◍</div><div class="i">◷</div></div>
      <div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
        <div style="${FS(13)};font-weight:900;margin-bottom:10px">${ctx.heading}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${files.map((f) => `<div class="vg-card" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px"><div style="width:34px;height:34px;border-radius:8px;background:rgba(0,89,255,.12);color:var(--brand-gold-deep);display:flex;align-items:center;justify-content:center"><span style="${FS(15)}">${ic(f[1])}</span></div><div style="${FS(9)};font-weight:700;text-align:center;word-break:break-all">${f[0]}</div></div>`).join("")}
        </div>
      </div>
    </div>`
  );
}

const ADAPTER_RENDERERS = {
  "ai-gateway": (ctx) => aiConsole(ctx),
  "http-api": (ctx) => codeEditor(ctx),
  github: (ctx) => codeEditor(ctx),
  supabase: (ctx) => dataPipeline(ctx),
  vercel: (ctx) => infraMonitor(ctx),
  railway: (ctx) => infraMonitor(ctx),
  "google-drive": (ctx) => fileManagerView(ctx),
  "base44-internal": (ctx) => businessDashboard(ctx),
  sandbox: (ctx) => codeEditor(ctx),
  "file-archive": (ctx) => fileManagerView(ctx),
  email: (ctx) => consultingReport(ctx),
};

/* ---------- Public API ---------- */

export function renderGeneratorType(type, config) {
  const ctx = ctxd(config);
  const cat = type.category || "business";
  const fn = CATEGORY_RENDERERS[cat] || businessDashboard;
  return { frame: "browser", designW: BROWSER.w, designH: BROWSER.h, html: `<div class="vg-screen">${fn(ctx)}</div>` };
}

export function renderRegistryRecord(record, entityName, config) {
  const ctx = ctxd(config);
  const fn = REGISTRY_RENDERERS[entityName] || generatorDagView;
  return { frame: "browser", designW: BROWSER.w, designH: BROWSER.h, html: `<div class="vg-screen">${fn(ctx, record)}</div>` };
}

export function renderAgent(agent, config) {
  const ctx = ctxd(config);
  const fn = AGENT_RENDERERS[agent?.key] || agentMissionControl;
  return { frame: "browser", designW: BROWSER.w, designH: BROWSER.h, html: `<div class="vg-screen">${fn(ctx, agent)}</div>` };
}

export function renderAdapter(adapter, config) {
  const ctx = ctxd(config);
  const fn = ADAPTER_RENDERERS[adapter?.adapter_key] || infraMonitor;
  return { frame: "browser", designW: BROWSER.w, designH: BROWSER.h, html: `<div class="vg-screen">${fn(ctx, adapter)}</div>` };
}