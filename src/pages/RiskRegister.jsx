import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, ShieldAlert, Plus, ChevronRight } from "lucide-react";

const RISK_MATRIX = {
  1: "bg-green-500/10 text-green-600", 2: "bg-green-500/10 text-green-600",
  3: "bg-amber-500/10 text-amber-600", 4: "bg-orange-500/10 text-orange-600",
  5: "bg-destructive/10 text-destructive"
};

export default function RiskRegister() {
  const navigate = useNavigate();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRisk, setNewRisk] = useState({ title: "", category: "security", likelihood: 3, impact: 3, description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.RiskRegister.filter({}, { sort: "-created_date", limit: 100 });
      setRisks(res.items || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRisk = async () => {
    if (!newRisk.title) return;
    try {
      const riskId = `risk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await base44.entities.RiskRegister.create({
        risk_id: riskId,
        title: newRisk.title,
        category: newRisk.category,
        likelihood: newRisk.likelihood,
        impact: newRisk.impact,
        risk_score: newRisk.likelihood * newRisk.impact,
        description: newRisk.description,
        status: "identified"
      });
      setNewRisk({ title: "", category: "security", likelihood: 3, impact: 3, description: "" });
      setShowForm(false);
      await load();
    } catch (e) {}
  };

  const updateStatus = async (risk, status) => {
    try { await base44.entities.RiskRegister.update(risk.id, { status }); await load(); } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/diagnostic")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <ShieldAlert size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Risk Register</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{risks.length} risks tracked · {risks.filter(r => r.status !== "resolved").length} open</p>
              <button onClick={() => setShowForm(!showForm)} className="xa-btn-outline text-xs"><Plus className="w-3 h-3" /> Add risk</button>
            </div>

            {showForm && (
              <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input value={newRisk.title} onChange={e => setNewRisk({ ...newRisk, title: e.target.value })} placeholder="Risk title" className="xa-input sm:col-span-2" />
                  <select value={newRisk.category} onChange={e => setNewRisk({ ...newRisk, category: e.target.value })} className="xa-input">
                    <option value="security">Security</option><option value="financial">Financial</option><option value="operational">Operational</option>
                    <option value="compliance">Compliance</option><option value="reputation">Reputation</option><option value="technical">Technical</option><option value="strategic">Strategic</option>
                  </select>
                  <div className="flex gap-3">
                    <label className="flex flex-col gap-1 text-xs"><span className="font-bold text-muted-foreground">Likelihood (1-5)</span>
                      <input type="number" min="1" max="5" value={newRisk.likelihood} onChange={e => setNewRisk({ ...newRisk, likelihood: parseInt(e.target.value) || 1 })} className="xa-input w-20" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs"><span className="font-bold text-muted-foreground">Impact (1-5)</span>
                      <input type="number" min="1" max="5" value={newRisk.impact} onChange={e => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) || 1 })} className="xa-input w-20" />
                    </label>
                  </div>
                  <textarea value={newRisk.description} onChange={e => setNewRisk({ ...newRisk, description: e.target.value })} placeholder="Risk description" className="xa-input sm:col-span-2 min-h-20" />
                  <button onClick={createRisk} className="xa-btn-primary sm:col-span-2">Create risk</button>
                </div>
              </div>
            )}

            {risks.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No risks tracked. Add one or run an audit to auto-generate risks from findings.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {risks.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).map(r => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${RISK_MATRIX[r.impact] || RISK_MATRIX[3]}`}>
                        <span className="text-lg font-black">{r.risk_score || r.likelihood * r.impact}</span>
                        <span className="text-[8px] font-bold uppercase">score</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{r.title}</p>
                        {r.description && <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
                          <span className="text-muted-foreground">Category: <span className="font-semibold text-foreground">{r.category}</span></span>
                          <span className="text-muted-foreground">L: {r.likelihood} × I: {r.impact}</span>
                        </div>
                      </div>
                      <select value={r.status} onChange={e => updateStatus(r, e.target.value)} className="shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-bold text-foreground">
                        <option value="identified">Identified</option><option value="assessed">Assessed</option>
                        <option value="mitigating">Mitigating</option><option value="accepted">Accepted</option><option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}