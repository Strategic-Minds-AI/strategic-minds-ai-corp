import React, { useState, useEffect, useMemo } from "react";
import { Eye, RefreshCw, Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import generatorTypes from "@/lib/factory/generator/registry/generator_types.json";
import { PREVIEW_STYLES } from "@/lib/gallery/previewStyles.js";
import { loadConfig, saveConfig, themeToCssVars, DEFAULT_CONFIG } from "@/lib/gallery/studioConfig.js";
import VisualizerPreview from "@/components/visualizer/VisualizerPreview.jsx";

// Inline StatusPill — avoids dependency on factory/EntityListPage
function StatusPill({ status }) {
  if (!status) return null;
  const colors = {
    passed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    active: "bg-blue-100 text-blue-700",
    draft: "bg-slate-100 text-slate-600",
    "canonical-seed": "bg-blue-100 text-blue-700",
  };
  const cls = colors[status] || "bg-slate-100 text-slate-600";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>{status}</span>;
}

const CATEGORY_COLORS = {
  code: "#0d2f96", ai: "#7c3aed", business: "#0d9488", consulting: "#f59e0b",
  marketing: "#e11d48", data: "#0891b2", infra: "#475569", design: "#db2777",
  compound: "#6366f1",
};

const REGISTRY_ENTITIES = [
  "GeneratorDefinition", "PolicyDefinition", "QualityProfile", "ValidationProfile",
  "WorkflowDefinition", "TemplatePack", "AdapterDefinition",
];

const tabCls = (on) =>
  `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${on ? "bg-[#0059ff] text-white" : "border border-input text-muted-foreground hover:text-foreground hover:bg-muted"}`;

function keyOf(r) {
  return r.generator_key || r.profile_key || r.policy_key || r.workflow_key || r.template_key || r.adapter_key || r.id;
}

export default function Visualizer() {
  const [tab, setTab] = useState("types");
  const [entity, setEntity] = useState("GeneratorDefinition");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [config] = useState(() => loadConfig());

  const themeVars = useMemo(() => themeToCssVars(config), [config]);

  const loadEntity = async (key) => {
    setLoading(true);
    setErr("");
    try {
      const page = await base44.entities[key].filter({}, { sort: "-created_date", limit: 60 });
      setRecords(page.items || []);
    } catch (e) {
      setErr(e?.message || "load failed");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const [live, setLive] = useState(false);

  useEffect(() => {
    if (tab === "records") loadEntity(entity);
  }, [tab, entity]);

  useEffect(() => {
    if (tab !== "records") return;
    let unsub;
    try { unsub = base44.entities[entity]?.subscribe?.(() => { setLive(true); loadEntity(entity); }); } catch { /* */ }
    return () => { try { unsub?.(); } catch {} };
  }, [tab, entity]);

  const types = generatorTypes.generator_types || [];
  const filteredTypes = useMemo(() => {
    if (!query) return types;
    const q = query.toLowerCase();
    return types.filter((t) => t.id.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [types, query]);

  const filteredRecords = useMemo(() => {
    if (!query) return records;
    const q = query.toLowerCase();
    return records.filter((r) => (r.name || "").toLowerCase().includes(q) || keyOf(r).toLowerCase().includes(q));
  }, [records, query]);

  const byCat = {};
  filteredTypes.forEach((t) => { (byCat[t.category] = byCat[t.category] || []).push(t); });

  const previewW = 232;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <style>{PREVIEW_STYLES}</style>

      <div className="flex items-center gap-3 mb-1">
        <div className="xa-icon-chip"><Eye className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-black font-heading flex items-center gap-2">Visualizer
            {tab === "records" && (
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${live ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{live ? "Live" : "Snapshot"}</span>
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Live rendered previews of every generator type and registry record — real-world output for each.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-5 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setTab("types")} className={tabCls(tab === "types")}>Generator Types</button>
          <button onClick={() => setTab("records")} className={tabCls(tab === "records")}>Registry Records</button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="pl-8 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>
      </div>

      {tab === "types" ? (
        <div style={themeVars} className="flex flex-col gap-6">
          {Object.entries(byCat).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[cat] || "#475569" }} />
                <h2 className="text-sm font-bold capitalize">{cat}</h2>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((t) => (
                  <div key={t.id} className="xa-card overflow-hidden flex flex-col">
                    <div className="flex items-center justify-center bg-muted/40 py-5 overflow-hidden">
                      <div className="origin-top">
                        <VisualizerPreview type={t} displayW={previewW} config={config} />
                      </div>
                    </div>
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold font-heading truncate">{t.type}</h3>
                        <span className="xa-pill-badge shrink-0" style={{ fontSize: 9 }}>{cat}</span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-1 truncate">{t.id}</div>
                      <div className="flex items-center justify-between mt-2">
                        <StatusPill status={t.status} />
                        <span className="text-[10px] font-mono">v{t.version}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={themeVars}>
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {REGISTRY_ENTITIES.map((r) => (
              <button key={r} onClick={() => setEntity(r)} className={tabCls(entity === r)}>{r.replace(/([A-Z])/g, " $1").trim()}</button>
            ))}
            <button onClick={() => loadEntity(entity)} className="p-2 rounded-lg border border-input hover:bg-muted" title="Reload"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
          </div>
          {loading ? (
            <div className="xa-card p-6 text-center text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
          ) : err ? (
            <div className="xa-card p-6 text-center text-sm text-red-600">{err}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="xa-card xa-card-subtle p-12 text-center text-sm">No records in {entity} yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecords.map((r) => (
                <div key={r.id} className="xa-card overflow-hidden flex flex-col">
                  <div className="flex items-center justify-center bg-muted/40 py-5 overflow-hidden">
                    <div className="origin-top">
                      <VisualizerPreview record={r} entityName={entity} displayW={previewW} config={config} />
                    </div>
                  </div>
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold font-heading truncate">{r.name || keyOf(r) || "Untitled"}</h3>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-1 truncate">{keyOf(r)}</div>
                    {r.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{r.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}