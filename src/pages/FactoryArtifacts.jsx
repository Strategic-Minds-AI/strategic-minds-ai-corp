import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Package, Loader2, FileCode, Download } from 'lucide-react';

export default function FactoryArtifacts() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artifactsLoading, setArtifactsLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listRuns', limit: 50 });
      setRuns(res.data?.runs || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const loadArtifacts = async (runId) => {
    setSelectedRun(runId);
    setArtifactsLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listArtifacts', run_id: runId });
      setArtifacts(res.data?.artifacts || []);
    } catch (e) { /* silent */ }
    setArtifactsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Package size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Artifact Explorer</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Select Run</label>
              <select className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={selectedRun || ''} onChange={(e) => loadArtifacts(e.target.value)}>
                <option value="">— Choose a run —</option>
                {runs.map((r) => <option key={r.id} value={r.id}>{r.run_id} — {r.generator_key}</option>)}
              </select>
            </div>

            {!selectedRun ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Package size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select a run to browse its artifacts.</p>
              </div>
            ) : artifactsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-primary" /></div>
            ) : artifacts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No artifacts for this run.</p>
            ) : (
              <div className="space-y-2">
                {artifacts.map((art) => (
                  <div key={art.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <FileCode size={16} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">{art.name}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{art.media_type}</span>
                      <ValidationStateBadge state={art.validation_state} />
                      <span className="ml-auto text-xs text-muted-foreground">{(art.size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                    {art.sha256 && <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">sha256: {art.sha256}</p>}
                    {art.content && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">{art.content}</pre>
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

function ValidationStateBadge({ state }) {
  const styles = { validated: 'bg-green-500/10 text-green-600', failed: 'bg-destructive/10 text-destructive', pending: 'bg-muted text-muted-foreground', blocked: 'bg-yellow-500/10 text-yellow-600' };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[state] || styles.pending}`}>{state}</span>;
}