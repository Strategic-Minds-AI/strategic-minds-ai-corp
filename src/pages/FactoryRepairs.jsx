import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Wrench, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const REPAIR_STATUSES = ['open', 'in_progress', 'completed', 'failed', 'cancelled'];

export default function FactoryRepairs() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repairsLoading, setRepairsLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listRuns', limit: 50 });
      setRuns(res.data?.runs || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const loadRepairs = async (runId) => {
    setSelectedRun(runId);
    setRepairsLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listRepairTasks', run_id: runId });
      setRepairs(res.data?.repairs || []);
    } catch (e) { /* silent */ }
    setRepairsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Wrench size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Repair Center</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Select Run</label>
              <select className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={selectedRun || ''} onChange={(e) => loadRepairs(e.target.value)}>
                <option value="">— Choose a run —</option>
                {runs.map((r) => <option key={r.id} value={r.id}>{r.run_id} — {r.generator_key}</option>)}
              </select>
            </div>

            {!selectedRun ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Wrench size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select a run to view its repair tasks.</p>
              </div>
            ) : repairsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-primary" /></div>
            ) : repairs.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No repair tasks for this run.</p>
            ) : (
              <div className="space-y-2">
                {repairs.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <RepairStatusIcon status={r.status} />
                      <span className="font-mono text-xs text-muted-foreground">{r.repair_id}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{r.failure_layer}</span>
                      {r.failing_validator && <span className="text-xs text-foreground">{r.failing_validator}</span>}
                      <span className="ml-auto text-[10px] text-muted-foreground">Round {r.repair_round}</span>
                    </div>
                    {r.target_step_key && <p className="mt-2 text-xs text-muted-foreground">Target: <span className="font-mono">{r.target_step_key}</span></p>}
                    {r.repair_spec && r.repair_spec !== '{}' && (
                      <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-muted p-2 text-xs text-muted-foreground">{r.repair_spec}</pre>
                    )}
                    {r.patch_applied && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-green-500/5 p-2 text-xs text-green-700">{r.patch_applied}</pre>
                    )}
                    <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                      <span>Rerun: <span className="font-bold">{r.rerun_result}</span></span>
                      <span>Regression: <span className="font-bold">{r.regression_status}</span></span>
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

function RepairStatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle size={16} className="text-green-600" />;
  if (status === 'failed') return <XCircle size={16} className="text-destructive" />;
  if (status === 'in_progress') return <Loader2 size={16} className="animate-spin text-blue-600" />;
  return <Clock size={16} className="text-muted-foreground" />;
}