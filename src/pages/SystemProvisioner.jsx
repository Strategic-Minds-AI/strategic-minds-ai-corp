import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Loader2, Rocket, Github, Cloud, Database, Globe,
  Server, Settings, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Trash2, Plus, Search, Zap, Boxes
} from "lucide-react";

const STACK_TYPES = [
  { value: "static_site", label: "Static Site", desc: "HTML/CSS — Vercel only" },
  { value: "vite_app", label: "Vite React App", desc: "Frontend — GitHub + Vercel" },
  { value: "backend_api", label: "Backend API", desc: "Node/Express — GitHub + Railway" },
  { value: "fullstack", label: "Fullstack", desc: "Frontend + Backend + Database" },
];

export default function SystemProvisioner() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [log, setLog] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // form state
  const [name, setName] = useState("");
  const [stackType, setStackType] = useState("vite_app");
  const [needsVercel, setNeedsVercel] = useState(true);
  const [needsRailway, setNeedsRailway] = useState(false);
  const [needsSupabase, setNeedsSupabase] = useState(false);
  const [needsDomain, setNeedsDomain] = useState(false);
  const [domain, setDomain] = useState("");
  const [envVarsText, setEnvVarsText] = useState("");
  const [customHtml, setCustomHtml] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        base44.functions.invoke("provisionSystem", { action: "dashboard" }),
        base44.functions.invoke("provisionSystem", { action: "list" }),
      ]);
      setStats(statsRes.data);
      setSystems(listRes.data?.systems || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const parseEnvVars = (text) => {
    const vars = {};
    text.split("\n").forEach(line => {
      const idx = line.indexOf("=");
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key) vars[key] = val;
      }
    });
    return vars;
  };

  const runProvision = async () => {
    if (!name.trim() || provisioning) return;
    setProvisioning(true); setError(null); setLog([]);
    try {
      const env_vars = envVarsText.trim() ? parseEnvVars(envVarsText) : {};
      const res = await base44.functions.invoke("provisionSystem", {
        action: "provision",
        name: name.trim(),
        stack_type: stackType,
        needs_vercel: needsVercel,
        needs_railway: needsRailway || stackType === "backend_api" || stackType === "fullstack",
        needs_supabase: needsSupabase || stackType === "fullstack",
        needs_domain: needsDomain,
        domain: domain.trim(),
        env_vars: Object.keys(env_vars).length ? env_vars : undefined,
        custom_html: stackType === "static_site" && customHtml.trim() ? customHtml : undefined,
      });
      if (res.data?.log) setLog(res.data.log);
      if (res.data?.error) setError(res.data.error);
      setName(""); setDomain(""); setEnvVarsText(""); setCustomHtml("");
      await load();
    } catch (e) { setError(e.message); }
    setProvisioning(false);
  };

  const runAction = async (systemId, action, extra = {}) => {
    try {
      await base44.functions.invoke("provisionSystem", { action, system_id: systemId, ...extra });
      await load();
    } catch (e) { setError(e.message); }
  };

  const checkDomain = async () => {
    if (!domain.trim()) return;
    try {
      const res = await base44.functions.invoke("provisionSystem", { action: "domain_check", domain: domain.trim() });
      if (res.data?.available) setError(null);
      else setError(`Domain not available${res.data?.price ? ` (price: ${res.data.price})` : ""}`);
    } catch (e) { setError(e.message); }
  };

  const deleteSystem = async (id) => {
    if (!confirm("Delete this system record? (Does NOT destroy the provisioned resources.)")) return;
    await runAction(id, "delete");
    setSelected(null);
  };

  const filtered = systems.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.github_repo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/factory")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Rocket size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">System Provisioner</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Corporate</span>
        <span className="ml-auto text-xs text-muted-foreground">GitHub · Vercel · Railway · Supabase · GoDaddy</span>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Systems" value={stats.total} icon={Boxes} />
                <StatCard label="GitHub Repos" value={stats.with_github} icon={Github} />
                <StatCard label="Vercel" value={stats.with_vercel} icon={Cloud} />
                <StatCard label="Railway" value={stats.with_railway_service} icon={Server} />
                <StatCard label="Supabase" value={stats.with_supabase} icon={Database} />
                <StatCard label="Domains" value={stats.with_domain} icon={Globe} />
                <StatCard label="Complete" value={stats.complete} icon={CheckCircle2} />
                <StatCard label="Failed" value={stats.failed} icon={XCircle} />
              </div>
            )}

            {/* Provisioning form */}
            <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Provision a New System</h2>
              </div>

              {/* Stack type selector */}
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STACK_TYPES.map(st => (
                  <button
                    key={st.value}
                    onClick={() => {
                      setStackType(st.value);
                      if (st.value === "backend_api") { setNeedsVercel(false); setNeedsRailway(true); }
                      else if (st.value === "fullstack") { setNeedsVercel(true); setNeedsRailway(true); setNeedsSupabase(true); }
                      else { setNeedsVercel(true); setNeedsRailway(false); }
                    }}
                    className={`rounded-lg border p-3 text-left transition-all ${stackType === st.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                  >
                    <p className="text-sm font-semibold text-foreground">{st.label}</p>
                    <p className="text-[10px] text-muted-foreground">{st.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">System Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="my-new-app" className="xa-input" disabled={provisioning} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Custom Domain (optional)</label>
                  <div className="flex gap-2">
                    <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className="xa-input" disabled={provisioning} />
                    <button onClick={checkDomain} disabled={!domain.trim()} className="xa-btn-outline shrink-0 text-xs">Check</button>
                  </div>
                </div>
              </div>

              {/* Resource toggles */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Toggle active={needsVercel} onClick={() => setNeedsVercel(!needsVercel)} icon={Cloud} label="Vercel" />
                <Toggle active={needsRailway} onClick={() => setNeedsRailway(!needsRailway)} icon={Server} label="Railway" />
                <Toggle active={needsSupabase} onClick={() => setNeedsSupabase(!needsSupabase)} icon={Database} label="Supabase" />
                <Toggle active={needsDomain} onClick={() => setNeedsDomain(!needsDomain)} icon={Globe} label="Domain DNS" />
              </div>

              {/* Advanced */}
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <Settings size={12} /> {showAdvanced ? "Hide" : "Show"} advanced (env vars / custom HTML)
              </button>
              {showAdvanced && (
                <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Environment Variables (one KEY=value per line)</label>
                    <textarea value={envVarsText} onChange={e => setEnvVarsText(e.target.value)} placeholder={"SUPABASE_URL=https://...\nSUPABASE_KEY=eyJ...\nWORKER_SECRET=..."} rows={4} className="xa-input font-mono text-xs" disabled={provisioning} />
                  </div>
                  {stackType === "static_site" && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">Custom HTML (optional — overrides generated files)</label>
                      <textarea value={customHtml} onChange={e => setCustomHtml(e.target.value)} placeholder="<!DOCTYPE html>..." rows={4} className="xa-input font-mono text-xs" disabled={provisioning} />
                    </div>
                  )}
                </div>
              )}

              {error && <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <button onClick={runProvision} disabled={provisioning || !name.trim()} className="xa-btn-primary mt-4">
                {provisioning ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</> : <><Rocket className="w-4 h-4" /> Provision System</>}
              </button>

              {/* Live log */}
              {log.length > 0 && (
                <div className="mt-4 rounded-lg border border-border bg-slate-900 p-3 font-mono text-xs text-green-400">
                  {log.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
            </div>

            {/* Systems list */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold text-foreground">Provisioned Systems ({systems.length})</h2>
                <div className="ml-auto flex items-center gap-2">
                  <Search size={14} className="text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="h-8 w-48 rounded-lg border border-border bg-background px-3 text-xs" />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                  <Rocket className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No systems provisioned yet. Use the form above to provision your first system.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(s => (
                    <SystemRow key={s.id} system={s} onSelect={() => setSelected(s)} onDelete={() => deleteSystem(s.id)} />
                  ))}
                </div>
              )}
            </div>

            {/* Detail drawer */}
            {selected && (
              <SystemDetail
                system={selected}
                onClose={() => setSelected(null)}
                onAction={runAction}
                onRefresh={load}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-primary" />
        <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Toggle({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
    >
      <Icon size={14} /> {label}
      {active && <CheckCircle2 size={12} />}
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-muted text-muted-foreground",
    github_ready: "bg-blue-500/10 text-blue-600",
    vercel_ready: "bg-cyan-500/10 text-cyan-600",
    railway_ready: "bg-purple-500/10 text-purple-600",
    supabase_ready: "bg-green-500/10 text-green-600",
    domain_ready: "bg-indigo-500/10 text-indigo-600",
    complete: "bg-green-500/10 text-green-600",
    failed: "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.pending}`}>{status?.replace("_", " ") || "pending"}</span>;
}

function SystemRow({ system, onSelect, onDelete }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <StatusBadge status={system.provision_status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{system.name}</p>
        <p className="truncate text-xs text-muted-foreground">{system.stack_type} · {system.github_repo || "no repo"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {system.github_repo && <Github size={14} className="text-muted-foreground" />}
        {system.vercel_id && <Cloud size={14} className="text-muted-foreground" />}
        {system.railway_service_id && <Server size={14} className="text-muted-foreground" />}
        {system.supabase_ref && <Database size={14} className="text-muted-foreground" />}
        {system.domain && <Globe size={14} className="text-muted-foreground" />}
      </div>
      {system.deployment_url && (
        <a href={system.deployment_url} target="_blank" rel="noreferrer" className="hidden shrink-0 text-xs font-semibold text-primary hover:underline sm:block">{system.deployment_url.replace("https://", "")}</a>
      )}
      <button onClick={onSelect} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><ChevronRight size={16} /></button>
      <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
    </div>
  );
}

function SystemDetail({ system, onClose, onAction, onRefresh }) {
  const [busy, setBusy] = useState(null);
  const [domainInput, setDomainInput] = useState("");

  const act = async (action, extra = {}) => {
    setBusy(action);
    try { await onAction(system.id, action, extra); await onRefresh(); }
    finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <StatusBadge status={system.provision_status} />
          <h3 className="text-sm font-bold text-foreground">{system.name}</h3>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><XCircle size={18} /></button>
        </div>

        <div className="space-y-2 text-xs">
          <DetailRow icon={Github} label="GitHub" value={system.github_repo} href={system.github_url} action={!system.github_repo ? () => act("github", { name: system.name, stack_type: system.stack_type }) : null} actionLabel="Create repo" busy={busy === "github"} />
          <DetailRow icon={Cloud} label="Vercel" value={system.vercel_id} href={system.vercel_url} action={system.github_repo && !system.vercel_id ? () => act("vercel") : null} actionLabel="Create project" busy={busy === "vercel"} />
          <DetailRow icon={Server} label="Railway" value={system.railway_id} href={system.railway_url} action={!system.railway_id ? () => act("railway", { with_service: true }) : null} actionLabel="Create project + service" busy={busy === "railway"} />
          <DetailRow icon={Database} label="Supabase" value={system.supabase_ref} href={system.supabase_url} action={!system.supabase_ref ? () => act("supabase") : null} actionLabel="Create database" busy={busy === "supabase"} />
          <DetailRow icon={Globe} label="Domain" value={system.domain} action={system.vercel_id ? () => act("domain_configure", { domain: domainInput || system.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com" }) : null} actionLabel="Configure DNS" busy={busy === "domain_configure"} />
        </div>

        {system.deployment_url && (
          <a href={system.deployment_url} target="_blank" rel="noreferrer" className="mt-4 block rounded-lg bg-primary/10 p-3 text-center text-sm font-semibold text-primary hover:underline">
            {system.deployment_url}
          </a>
        )}

        {system.env_vars && system.env_vars !== "[]" && (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Env Vars Set</p>
            <p className="font-mono text-xs text-foreground">{system.env_vars}</p>
          </div>
        )}

        {system.description && (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{system.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, href, action, actionLabel, busy }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <Icon size={16} className="shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
        {value ? (
          href ? <a href={href} target="_blank" rel="noreferrer" className="block truncate text-xs font-semibold text-primary hover:underline">{value}</a>
               : <p className="truncate text-xs font-semibold text-foreground">{value}</p>
        ) : (
          <p className="text-xs text-muted-foreground/60">Not provisioned</p>
        )}
      </div>
      {action && (
        <button onClick={action} disabled={busy} className="shrink-0 rounded-lg border border-primary px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-50">
          {busy ? <Loader2 size={12} className="animate-spin" /> : actionLabel}
        </button>
      )}
    </div>
  );
}