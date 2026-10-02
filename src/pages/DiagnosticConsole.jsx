import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Search, TrendingDown, ShieldAlert, Wrench, Mail, Activity, FileSearch, ChevronRight, AlertTriangle, CheckCircle2, DollarSign, Gauge, Network, Database, ShieldCheck, Copy } from "lucide-react";

export default function DiagnosticConsole() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, auditsRes] = await Promise.all([
        base44.functions.invoke("runBusinessAudit", { action: "dashboardStats" }),
        base44.functions.invoke("runBusinessAudit", { action: "listAudits", limit: 50 })
      ]);
      setStats(statsRes.data);
      setAudits(auditsRes.data?.audits || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runScan = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl || scanning) return;
    setScanning(true); setError(null); setScanResult(null);
    try {
      const res = await base44.functions.invoke("runBusinessAudit", {
        action: "runAudit", company_url: cleanUrl, company_name: name.trim() || cleanUrl, audit_type: "full"
      });
      setScanResult(res.data);
      await load();
    } catch (e) { setError(e.message); }
    setScanning(false);
  };

  const ROUTES = [
    { path: "/diagnostic/repairs", label: "Repair Plans", icon: Wrench, desc: "30-60-90 day action plans" },
    { path: "/diagnostic/monitoring", label: "Monitoring", icon: Activity, desc: "Continuous health checks" },
    { path: "/diagnostic/risks", label: "Risk Register", icon: ShieldAlert, desc: "Track and mitigate risks" },
    { path: "/diagnostic/outreach", label: "Outreach Drafts", icon: Mail, desc: "Value-first prospect emails" },
    { path: "/diagnostic/evidence", label: "Evidence Trail", icon: Database, desc: "Audit receipts & snapshots" },
    { path: "/diagnostic/leaks", label: "Revenue Leaks", icon: TrendingDown, desc: "Quantified $ impact" },
    { path: "/diagnostic/system-map", label: "System Map", icon: Network, desc: "Detected tech stack" },
    { path: "/diagnostic/clone", label: "Site Clone Studio", icon: Copy, desc: "Deterministic site cloning" },
  ];

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/agents")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <FileSearch size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Business Diagnostic Engine</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Live Audit</span>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Audits Run" value={stats.audits || 0} icon={FileSearch} />
                <StatCard label="Findings" value={stats.findings || 0} icon={AlertTriangle} />
                <StatCard label="Critical" value={stats.critical_findings || 0} icon={ShieldAlert} />
                <StatCard label="Repair Plans" value={stats.repair_plans || 0} icon={Wrench} />
                <StatCard label="Avg Health" value={`${stats.avg_health_score || 0}/100`} icon={Gauge} />
                <StatCard label="Revenue Leak" value={`$${((stats.total_leak_max || 0) / 1000).toFixed(0)}K`} icon={DollarSign} />
                <StatCard label="Evidence" value={stats.evidence_records || 0} icon={Database} />
                <StatCard label="System Nodes" value={stats.system_nodes || 0} icon={Network} />
                <StatCard label="Snapshots" value={stats.scan_snapshots || 0} icon={ShieldCheck} />
              </div>
            )}

            {/* Scan form */}
            <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Run a Business Diagnostic</h2>
              <p className="mb-4 text-xs text-muted-foreground">Enter any company URL. The engine performs real HTTP checks — SSL, SEO, security headers, performance, conversion elements, content quality — and quantifies revenue impact.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Company name (optional)" className="xa-input sm:max-w-xs" disabled={scanning} />
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && runScan()} placeholder="example.com" className="xa-input sm:max-w-xs" disabled={scanning} />
                <button onClick={runScan} disabled={scanning || !url.trim()} className="xa-btn-primary">
                  {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</> : <><Search className="w-4 h-4" /> Run diagnostic</>}
                </button>
              </div>
              {error && <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              {scanResult && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-bold text-foreground">Diagnostic complete — {scanResult.company}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <ResultMetric label="Health Score" value={`${scanResult.health_score}/100`} />
                    <ResultMetric label="Findings" value={scanResult.finding_count} />
                    <ResultMetric label="Critical" value={scanResult.critical_count} />
                    <ResultMetric label="Annual Leak" value={`$${((scanResult.annual_leak_max || 0) / 1000).toFixed(0)}K`} />
                  </div>
                  <button onClick={() => navigate(`/diagnostic/audit/${scanResult.audit_id}`)} className="xa-btn-outline mt-3 text-xs">
                    View full report <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Module routes */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ROUTES.map(r => (
                <button key={r.path} onClick={() => navigate(r.path)} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-top-0.5 hover:shadow-md">
                  <r.icon size={20} className="mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Recent audits */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Audits</h2>
              {audits.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                  <FileSearch className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No audits yet. Run a diagnostic above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {audits.map(a => (
                    <button key={a.id} onClick={() => navigate(`/diagnostic/audit/${a.audit_id}`)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md">
                      <HealthBadge score={a.health_score || 0} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{a.company_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.company_url}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {a.critical_count > 0 && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">{a.critical_count} critical</span>}
                        <span className="text-xs text-muted-foreground">{a.finding_count || 0} findings</span>
                        {(a.annual_leak_max || 0) > 0 && <span className="text-xs font-bold text-primary">${((a.annual_leak_max) / 1000).toFixed(0)}K leak</span>}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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

function ResultMetric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function HealthBadge({ score }) {
  const color = score >= 80 ? "#16a34a" : score >= 50 ? "#2563eb" : score >= 25 ? "#f59e0b" : "#dc2626";
  const bg = score >= 80 ? "bg-green-500/10" : score >= 50 ? "bg-blue-500/10" : score >= 25 ? "bg-amber-500/10" : "bg-red-500/10";
  return (
    <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${bg}`}>
      <span className="text-lg font-black" style={{ color }}>{score}</span>
      <span className="text-[8px] font-bold uppercase text-muted-foreground">score</span>
    </div>
  );
}