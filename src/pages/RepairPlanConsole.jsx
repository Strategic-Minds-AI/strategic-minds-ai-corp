import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Wrench, ChevronRight, Calendar, CheckCircle2, Clock, User } from "lucide-react";

export default function RepairPlanConsole() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.RepairPlan.filter({}, { sort: "-created_date", limit: 50 });
      const planList = res.items || [];
      setPlans(planList);
      if (planList.length > 0 && !selectedPlan) setSelectedPlan(planList[0]);
    } catch (e) {}
    setLoading(false);
  }, [selectedPlan]);

  const loadActions = useCallback(async () => {
    if (!selectedPlan) return;
    try {
      const res = await base44.entities.RepairActionItem.filter({ plan_id: selectedPlan.plan_id });
      setActions(res.items || []);
    } catch (e) { setActions([]); }
  }, [selectedPlan]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadActions(); }, [loadActions]);

  const updateActionStatus = async (actionId, status) => {
    try {
      const res = await base44.entities.RepairActionItem.filter({ action_id: actionId }, { limit: 1 });
      const action = res.items[0];
      if (action) {
        await base44.entities.RepairActionItem.update(action.id, {
          status,
          completed_at: status === "completed" ? new Date().toISOString() : null
        });
        await loadActions();
      }
    } catch (e) {}
  };

  const phaseActions = (phase) => actions.filter(a => a.phase === phase).sort((a, b) => (a.priority || 9) - (b.priority || 9));

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/diagnostic")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Wrench size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Repair Plans</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Wrench className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No repair plans yet. Run a diagnostic and generate a plan from the audit detail page.</p>
            <button onClick={() => navigate("/diagnostic")} className="xa-btn-primary mt-4">Go to Diagnostic Console</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Plan list */}
            <div className="lg:col-span-1">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Plans</h2>
              <div className="space-y-2">
                {plans.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlan(p)} className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-all ${selectedPlan?.id === p.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:shadow-sm"}`}>
                    <p className="text-sm font-bold text-foreground">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress_percentage || 0}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{p.progress_percentage || 0}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{p.total_actions} actions · {p.completed_actions || 0} done</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action detail */}
            <div className="lg:col-span-2">
              {selectedPlan && (
                <>
                  <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">{selectedPlan.title}</p>
                        <p className="text-xs text-muted-foreground">{selectedPlan.horizon_days}-day horizon · est. recovery ${(selectedPlan.estimated_revenue_recovery || 0).toLocaleString()}/yr</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${selectedPlan.status === "completed" ? "bg-green-500/10 text-green-600" : selectedPlan.status === "in_progress" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"}`}>{selectedPlan.status}</span>
                    </div>
                  </div>

                  {[30, 60, 90].map(phase => {
                    const items = phaseActions(phase);
                    if (items.length === 0) return null;
                    return (
                      <div key={phase} className="mb-6">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          Phase {phase} — Days 1–{phase}
                          <span className="text-xs font-normal text-muted-foreground">({items.length} actions)</span>
                        </h3>
                        <div className="space-y-2">
                          {items.map(a => (
                            <div key={a.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">
                                  {a.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : a.status === "in_progress" ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-foreground">{a.title}</p>
                                  {a.description && <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>}
                                  <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
                                    {a.owner_role && <span className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" /> {a.owner_role}</span>}
                                    <span className="text-muted-foreground">Priority: {a.priority}</span>
                                    <span className="text-muted-foreground">Effort: {a.effort_estimate}</span>
                                    <span className="text-muted-foreground">Target: Day {a.target_day}</span>
                                  </div>
                                  {a.success_metric && <p className="mt-1 text-[10px] text-primary">KPI: {a.success_metric}</p>}
                                  {a.status !== "completed" && (
                                    <div className="mt-2 flex gap-2">
                                      {a.status === "pending" && <button onClick={() => updateActionStatus(a.action_id, "in_progress")} className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-500/20">Start</button>}
                                      {a.status === "in_progress" && <button onClick={() => updateActionStatus(a.action_id, "completed")} className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 hover:bg-green-500/20">Complete</button>}
                                      <button onClick={() => updateActionStatus(a.action_id, "blocked")} className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 hover:bg-amber-500/20">Block</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}