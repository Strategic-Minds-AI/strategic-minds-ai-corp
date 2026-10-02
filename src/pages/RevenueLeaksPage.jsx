import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, TrendingDown, DollarSign, AlertCircle } from "lucide-react";

export default function RevenueLeaksPage() {
  const navigate = useNavigate();
  const { auditId } = useParams();
  const [leaks, setLeaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("runBusinessAudit", {
        action: "getRevenueLeaks",
        audit_id: auditId || ""
      });
      setLeaks(res.data?.leaks || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [auditId]);

  useEffect(() => { load(); }, [load]);

  const totalMin = leaks.reduce((s, l) => s + (l.annual_impact_min || 0), 0);
  const totalMax = leaks.reduce((s, l) => s + (l.annual_impact_max || 0), 0);
  const recovered = leaks.filter(l => l.status === 'recovered').length;

  const categoryColor = (cat) => {
    const map = {
      conversion_loss: 'bg-red-500/10 text-red-600',
      seo_traffic_loss: 'bg-blue-500/10 text-blue-600',
      security_breach_risk: 'bg-destructive/10 text-destructive',
      performance_penalty: 'bg-amber-500/10 text-amber-600',
      trust_deficit: 'bg-purple-500/10 text-purple-600',
      mobile_gap: 'bg-cyan-500/10 text-cyan-600',
      content_gap: 'bg-indigo-500/10 text-indigo-600',
      infrastructure_cost: 'bg-slate-500/10 text-slate-600',
      compliance_fine_risk: 'bg-orange-500/10 text-orange-600'
    };
    return map[cat] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <TrendingDown size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Revenue Leaks</span>
        <span className="text-xs text-muted-foreground">{leaks.length} leaks identified</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        ) : leaks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <TrendingDown className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No revenue leaks quantified yet. Run a diagnostic audit to identify and quantify leaks.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2"><DollarSign size={14} className="text-primary" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Total Min</span></div>
                <p className="mt-1 text-2xl font-bold text-foreground">${(totalMin / 1000).toFixed(0)}K</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2"><DollarSign size={14} className="text-destructive" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Total Max</span></div>
                <p className="mt-1 text-2xl font-bold text-destructive">${(totalMax / 1000).toFixed(0)}K</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2"><AlertCircle size={14} className="text-green-600" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Recovered</span></div>
                <p className="mt-1 text-2xl font-bold text-green-600">{recovered}</p>
              </div>
            </div>

            {/* Leak list */}
            <div className="space-y-2">
              {leaks.map(l => (
                <div key={l.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${categoryColor(l.category)}`}>{l.category.replace(/_/g, ' ')}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.status === 'recovered' ? 'bg-green-500/10 text-green-600' : l.status === 'recovering' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>{l.status}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{l.description?.slice(0, 120)}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Confidence: {l.confidence}%</span>
                        <span>Recovery: {l.recovery_potential}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-destructive">${((l.annual_impact_max || 0) / 1000).toFixed(0)}K</p>
                      <p className="text-[10px] text-muted-foreground">annual max</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}