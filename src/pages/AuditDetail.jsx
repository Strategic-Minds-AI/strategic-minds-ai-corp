import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Wrench, Mail, ShieldAlert, ChevronRight, CheckCircle2, XCircle, AlertTriangle, FileText, TrendingDown, Search, Activity, Cpu, Eye, Server, Target, ShieldCheck } from "lucide-react";

const SEVERITY_STYLE = {
  critical: { bg: "bg-destructive/10", text: "text-destructive", label: "Critical" },
  high: { bg: "bg-orange-500/10", text: "text-orange-600", label: "High" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Medium" },
  low: { bg: "bg-blue-500/10", text: "text-blue-600", label: "Low" },
};

const CATEGORY_ICON = {
  seo: Search, security: ShieldAlert, performance: Activity, revenue: TrendingDown,
  technical: Cpu, ux: Eye, content: FileText, infrastructure: Server, conversion: Target, compliance: ShieldCheck
};

export default function AuditDetail() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("runBusinessAudit", { action: "getAudit", audit_id: auditId });
      setData(res.data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [auditId]);

  const genPlan = async () => {
    setGeneratingPlan(true); setActionError(null);
    try {
      await base44.functions.invoke("runBusinessAudit", { action: "generateRepairPlan", audit_id: auditId });
      await load();
    } catch (e) { setActionError(e.message); }
    setGeneratingPlan(false);
  };

  const genOutreach = async () => {
    setGeneratingOutreach(true); setActionError(null);
    try {
      await base44.functions.invoke("runBusinessAudit", { action: "generateOutreach", audit_id: auditId });
      await load();
    } catch (e) { setActionError(e.message); }
    setGeneratingOutreach(false);
  };

  const approveFinding = async (findingId, status) => {
    try {
      await base44.functions.invoke("runBusinessAudit", { action: "approveFinding", finding_id: findingId, status });
      await load();
    } catch (e) { setActionError(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-6 text-center text-destructive">{error}</div>;
  if (!data?.audit) return <div className="p-6 text-center text-muted-foreground">Audit not found</div>;

  const { audit, findings = [], plans = [], drafts = [], risks = [] } = data;
  const sortedFindings = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] || 9) - (order[b.severity] || 9);
  });

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/diagnostic")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <FileText size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">{audit.company_name}</span>
        <span className="text-xs text-muted-foreground">{audit.company_url}</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Health Score Banner */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Business Health Score</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-foreground">{audit.health_score}</span>
                <span className="text-lg text-muted-foreground">/ 100</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {audit.finding_count} findings · {audit.critical_count} critical · {audit.high_count} high
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Estimated Annual Revenue Leak</p>
              <p className="text-3xl font-black text-primary">${(audit.annual_leak_min || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">to ${(audit.annual_leak_max || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button onClick={genPlan} disabled={generatingPlan} className="xa-btn-primary">
            {generatingPlan ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Wrench className="w-4 h-4" /> Generate Repair Plan</>}
          </button>
          <button onClick={genOutreach} disabled={generatingOutreach} className="xa-btn-outline">
            {generatingOutreach ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Mail className="w-4 h-4" /> Draft Outreach</>}
          </button>
        </div>
        {actionError && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{actionError}</div>}

        {/* Repair Plans */}
        {plans.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Repair Plans</h2>
            <div className="space-y-2">
              {plans.map(p => (
                <button key={p.id} onClick={() => navigate("/diagnostic/repairs")} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm hover:shadow-md">
                  <Wrench className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.total_actions} actions · {p.phase_30 ? JSON.parse(p.phase_30 || "[]").length : 0} in 30-day phase</p>
                  </div>
                  <div className="w-32">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress_percentage || 0}%` }} />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-muted-foreground">{p.progress_percentage || 0}%</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Findings */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Findings ({findings.length})</h2>
          {findings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
              <p className="mt-2 text-sm text-muted-foreground">No issues found — this business is in great shape.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedFindings.map(f => {
                const sev = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.medium;
                return (
                  <div key={f.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${sev.bg} ${sev.text}`}>{sev.label}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{f.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs">
                          <span className="text-muted-foreground">Category: <span className="font-semibold text-foreground">{f.category}</span></span>
                          <span className="text-muted-foreground">Confidence: <span className="font-semibold text-foreground">{f.confidence}%</span></span>
                          {(f.annual_impact_max || 0) > 0 && (
                            <span className="text-muted-foreground">Impact: <span className="font-semibold text-primary">${(f.annual_impact_min || 0).toLocaleString()}–${(f.annual_impact_max || 0).toLocaleString()}/yr</span></span>
                          )}
                        </div>
                        {f.recommended_repair && (
                          <div className="mt-2 rounded-lg bg-primary/5 p-2 text-xs text-foreground">
                            <span className="font-bold">Repair: </span>{f.recommended_repair}
                          </div>
                        )}
                        {f.approval_status === "pending" && (
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => approveFinding(f.finding_id, "approved")} className="rounded-lg bg-green-500/10 px-3 py-1 text-xs font-bold text-green-600 hover:bg-green-500/20">Approve</button>
                            <button onClick={() => approveFinding(f.finding_id, "disputed")} className="rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 hover:bg-amber-500/20">Dispute</button>
                            <button onClick={() => approveFinding(f.finding_id, "rejected")} className="rounded-lg bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive hover:bg-destructive/20">Reject</button>
                          </div>
                        )}
                        {f.approval_status !== "pending" && (
                          <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{f.approval_status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Outreach Drafts */}
        {drafts.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Outreach Drafts</h2>
            <div className="space-y-2">
              {drafts.map(d => (
                <div key={d.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">{d.subject}</p>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${d.approval_status === "approved" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>{d.approval_status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4">{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report */}
        {audit.report_markdown && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Full Report</h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <pre className="whitespace-pre-wrap text-xs text-foreground font-mono leading-relaxed">{audit.report_markdown}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}