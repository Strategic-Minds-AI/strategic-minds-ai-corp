import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Loader2, AlertCircle, ExternalLink, Globe, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CampaignMonitor({ batchId, onReset }) {
  const [batch, setBatch] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await base44.functions.invoke('massLaunch', { action: 'getBatch', batch_id: batchId });
      setBatch(res.data?.batch || null);
      setCampaigns(res.data?.campaigns || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [batchId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const stats = {
    total: campaigns.length,
    running: campaigns.filter(c => c.status === 'running').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    failed: campaigns.filter(c => c.status === 'failed').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Launch Monitor</h3>
          <p className="text-sm text-muted-foreground">{batch?.name || 'Batch'} — {stats.total} websites</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg border border-border p-2 text-foreground hover:bg-muted"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={onReset} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">New Launch</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Running</span></div>
          <p className="mt-1 text-2xl font-bold text-primary">{stats.running}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Done</span></div>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Failed</span></div>
          <p className="mt-1 text-2xl font-bold text-destructive">{stats.failed}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Total</span></div>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
      </div>

      <div className="space-y-2">
        {campaigns.map(c => (
          <div key={c.campaign_id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.status === 'running' ? 'bg-primary/10 text-primary' : c.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
              {c.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : c.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{c.business_name || c.keyword}</p>
              <p className="truncate text-xs text-muted-foreground">{c.city}, {c.state} · {c.domain || 'No domain'} · {c.phase}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${c.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${c.progress_percent || 0}%` }} />
              </div>
            </div>
            {c.vercel_deployment_url && (
              <a href={c.vercel_deployment_url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-border p-2 text-foreground hover:bg-muted">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}