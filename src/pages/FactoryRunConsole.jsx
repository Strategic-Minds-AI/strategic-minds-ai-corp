import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Activity, Loader2, X, ChevronDown, ChevronRight, Play, Ban } from 'lucide-react';

const STATUSES = ['DRAFT', 'VALIDATING_INPUT', 'PLANNING', 'WAITING_APPROVAL', 'QUEUED', 'RUNNING', 'VALIDATING', 'REPAIRING', 'PASSED', 'FAILED', 'BLOCKED', 'CANCELLED', 'EXPORTED'];

export default function FactoryRunConsole() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedRun, setExpandedRun] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepsLoading, setStepsLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listRuns', status: statusFilter || undefined, limit: 50 });
      setRuns(res.data?.runs || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const loadSteps = async (runId) => {
    setStepsLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listSteps', run_id: runId });
      setSteps(res.data?.steps || []);
    } catch (e) { /* silent */ }
    setStepsLoading(false);
  };

  const toggleRun = (runId) => {
    if (expandedRun === runId) { setExpandedRun(null); return; }
    setExpandedRun(runId);
    loadSteps(runId);
  };

  const cancelRun = async (runId) => {
    try {
      await base44.functions.invoke('factoryOS', { action: 'cancelRun', id: runId });
      await loadRuns();
    } catch (e) { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Activity size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Run Console</span>
        <select className="ml-auto rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Activity size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No runs found. Create one from the Generator Studio.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-3 p-3">
                  <button onClick={() => toggleRun(run.id)} className="rounded p-1 text-muted-foreground hover:bg-muted">
                    {expandedRun === run.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <StatusBadge status={run.status} />
                  <span className="font-mono text-xs text-muted-foreground">{run.run_id}</span>
                  <span className="text-sm text-foreground">{run.generator_key}</span>
                  <span className="text-xs text-muted-foreground">v{run.generator_version}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{run.completed_steps}/{run.total_steps} steps</span>
                  {!['PASSED', 'FAILED', 'CANCELLED', 'EXPORTED'].includes(run.status) && (
                    <button onClick={() => cancelRun(run.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Ban size={14} /></button>
                  )}
                </div>
                {expandedRun === run.id && (
                  <div className="border-t border-border p-3">
                    {stepsLoading ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Loading steps...</div>
                    ) : steps.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">No steps recorded for this run.</p>
                    ) : (
                      <div className="space-y-1">
                        {steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                            <StepStatusIcon status={step.status} />
                            <span className="font-mono text-xs text-foreground">{step.step_key}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{step.step_type}</span>
                            {step.error && <span className="ml-auto truncate text-xs text-destructive">{step.error}</span>}
                            <span className="ml-auto text-[10px] text-muted-foreground">{step.attempt_count}/{step.max_attempts} attempts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PASSED: 'bg-green-500/10 text-green-600', FAILED: 'bg-destructive/10 text-destructive',
    RUNNING: 'bg-blue-500/10 text-blue-600', BLOCKED: 'bg-amber-500/10 text-amber-600',
    CANCELLED: 'bg-muted text-muted-foreground', DRAFT: 'bg-muted text-muted-foreground',
    EXPORTED: 'bg-purple-500/10 text-purple-600', QUEUED: 'bg-cyan-500/10 text-cyan-600',
    REPAIRING: 'bg-orange-500/10 text-orange-600', VALIDATING: 'bg-indigo-500/10 text-indigo-600',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.DRAFT}`}>{status}</span>;
}

function StepStatusIcon({ status }) {
  const colors = { completed: 'text-green-600', failed: 'text-destructive', running: 'text-blue-600', pending: 'text-muted-foreground' };
  return <span className={`h-2 w-2 rounded-full bg-current ${colors[status] || colors.pending}`} />;
}