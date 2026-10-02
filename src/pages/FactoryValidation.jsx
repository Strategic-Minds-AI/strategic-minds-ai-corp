import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, CheckCircle, Loader2, XCircle, Shield } from 'lucide-react';

const VALIDATORS = ['schema', 'completeness', 'lint', 'typecheck', 'compile', 'unit_tests', 'integration_tests', 'e2e', 'visual_regression', 'accessibility', 'security_scan', 'dependency_scan', 'secret_scan', 'data_integrity', 'rls', 'backend_parity', 'artifact_integrity', 'acceptance_criteria'];

export default function FactoryValidation() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listRuns', limit: 50 });
      setRuns(res.data?.runs || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const loadReceipts = async (runId) => {
    setSelectedRun(runId);
    setReceiptsLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listValidationReceipts', run_id: runId });
      setReceipts(res.data?.receipts || []);
    } catch (e) { /* silent */ }
    setReceiptsLoading(false);
  };

  const passCount = receipts.filter((r) => r.status === 'PASS').length;
  const failCount = receipts.filter((r) => r.status === 'FAIL').length;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <CheckCircle size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Validation Center</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="mb-4 flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Select Run</label>
                <select className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={selectedRun || ''} onChange={(e) => loadReceipts(e.target.value)}>
                  <option value="">— Choose a run —</option>
                  {runs.map((r) => <option key={r.id} value={r.id}>{r.run_id} — {r.generator_key}</option>)}
                </select>
              </div>
              {selectedRun && (
                <div className="flex gap-2">
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-600">{passCount} PASS</span>
                  <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">{failCount} FAIL</span>
                </div>
              )}
            </div>

            {!selectedRun ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Shield size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select a run to review its validation receipts.</p>
              </div>
            ) : receiptsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-primary" /></div>
            ) : receipts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No validation receipts for this run.</p>
            ) : (
              <div className="space-y-2">
                {receipts.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      {r.status === 'PASS' ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-destructive" />}
                      <span className="text-sm font-semibold text-foreground">{r.validator_id}</span>
                      {!r.is_mandatory && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">optional</span>}
                      <span className="ml-auto text-[10px] text-muted-foreground">{r.subject_type}</span>
                    </div>
                    {r.failures && r.failures !== '[]' && (
                      <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-destructive/5 p-2 text-xs text-destructive">{r.failures}</pre>
                    )}
                    {r.evidence && r.evidence !== '[]' && (
                      <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-muted p-2 text-xs text-muted-foreground">{r.evidence}</pre>
                    )}
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