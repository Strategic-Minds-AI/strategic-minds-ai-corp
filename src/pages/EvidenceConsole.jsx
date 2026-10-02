import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, FileSearch, Hash, ExternalLink, Shield, Globe, FileCode, Link2 } from "lucide-react";

export default function EvidenceConsole() {
  const navigate = useNavigate();
  const { auditId } = useParams();
  const [evidence, setEvidence] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('evidence');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, snapRes, recRes] = await Promise.all([
        base44.functions.invoke("runBusinessAudit", { action: "getEvidence", audit_id: auditId || "" }),
        base44.functions.invoke("runBusinessAudit", { action: "getSnapshots", audit_id: auditId || "" }),
        base44.functions.invoke("runBusinessAudit", { action: "getReceipts", audit_id: auditId || "" })
      ]);
      setEvidence(evRes.data?.evidence || []);
      setSnapshots(snapRes.data?.snapshots || []);
      setReceipts(recRes.data?.receipts || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [auditId]);

  useEffect(() => { load(); }, [load]);

  const sourceIcon = (type) => {
    const map = { ssl_check: Shield, page_fetch: Globe, seo_meta: FileCode, security_headers: Shield, robots_txt: FileCode, sitemap_xml: FileCode, sensitive_path: Shield, broken_link: Link2, tech_stack: FileCode, performance: Globe, conversion_audit: FileCode };
    return map[type] || FileSearch;
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <FileSearch size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Evidence & Audit Trail</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setTab('evidence')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tab === 'evidence' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Evidence ({evidence.length})</button>
          <button onClick={() => setTab('snapshots')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tab === 'snapshots' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Snapshots ({snapshots.length})</button>
          <button onClick={() => setTab('receipts')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tab === 'receipts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Receipts ({receipts.length})</button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        ) : tab === 'evidence' ? (
          evidence.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <FileSearch className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No evidence collected yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {evidence.map(ev => {
                const Icon = sourceIcon(ev.source_type);
                return (
                  <div key={ev.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-primary" />
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">{ev.source_type.replace(/_/g, ' ')}</span>
                      {ev.status_code && <span className="text-[10px] text-muted-foreground">HTTP {ev.status_code}</span>}
                      <span className="ml-auto text-[10px] text-muted-foreground">{new Date(ev.captured_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground">{ev.content_summary}</p>
                    {ev.source_uri && (
                      <a href={ev.source_uri} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:underline">
                        <ExternalLink size={10} /> {ev.source_uri}
                      </a>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Hash size={10} /> {ev.content_hash}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : tab === 'snapshots' ? (
          snapshots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">No scan snapshots yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map(s => {
                const tech = (() => { try { return JSON.parse(s.tech_stack || '[]'); } catch { return []; } })();
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg ${s.health_score >= 80 ? 'bg-green-500/10' : s.health_score >= 50 ? 'bg-blue-500/10' : s.health_score >= 25 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                        <span className="text-sm font-black" style={{ color: s.health_score >= 80 ? '#16a34a' : s.health_score >= 50 ? '#2563eb' : s.health_score >= 25 ? '#f59e0b' : '#dc2626' }}>{s.health_score}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{s.scan_type} scan</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.scanned_at).toLocaleString()} · {s.finding_count} findings · {s.critical_count} critical</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">${((s.annual_leak_max || 0) / 1000).toFixed(0)}K</p>
                        <p className="text-[10px] text-muted-foreground">leak/yr</p>
                      </div>
                    </div>
                    {tech.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tech.map(t => <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          receipts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">No audit receipts yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map(r => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.status === 'success' ? 'bg-green-500/10 text-green-600' : r.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>{r.status}</span>
                    <span className="text-xs font-mono text-primary">{r.system}</span>
                    <span className="text-xs text-muted-foreground">→ {r.action}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{new Date(r.created_at || r.created_date).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground">{r.summary}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}