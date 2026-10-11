import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, CircleAlert, Database, KeyRound, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { functions } from '@/lib/functionClient';
const labels = {
  'studio.templates.list': ['Template library', 'Read Studio template metadata'],
  'vault.accounts.list': ['Connected accounts', 'List account names, never passwords'],
  'ai.gateway.readiness': ['Vercel AI Gateway', 'Check backend AI connection'],
  'studio.sync.readiness': ['GPT pack sync', 'Check import authentication binding'],
};
export default function BrokerStatusPanel() {
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [checking, setChecking] = useState('');
  const [lastChecked, setLastChecked] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = (await functions.invoke('credentialBroker', { action: 'catalog' })).data;
      if (!Array.isArray(response?.capabilities)) throw new Error('Invalid connection status');
      setCapabilities(response.capabilities);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (e) { setCapabilities([]); setError(e?.message || 'Connection status unavailable'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const inspect = async capability => {
    setChecking(capability); setError('');
    try {
      const response = (await functions.invoke('credentialBroker', { action: 'execute', capability, limit: 20 })).data;
      setDetail({ capability, items: Array.isArray(response?.items) ? response.items : [] });
    } catch (e) { setError(e?.message || 'Could not inspect connected records'); }
    finally { setChecking(''); }
  };
  const ready = capabilities.filter(item => item.ready).length;
  return (
    <section aria-labelledby="broker-title" className="mb-8 rounded-2xl border border-border bg-card p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3 text-primary"><ShieldCheck size={23} /></div>
          <div>
            <p className="agency-eyebrow mb-1">CREDENTIAL CONTROL CENTER</p>
            <h2 id="broker-title" className="text-xl font-bold">Agent capability access</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Connected services execute allowed operations server-side. GPT and agents never receive raw passwords or keys.</p>
          </div>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Checking' : 'Recheck access'}
        </button>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-medium">{ready} of {capabilities.length} backend capabilities ready</span>
        {lastChecked && <span className="text-muted-foreground">Checked {lastChecked}</span>}
        <span className="flex items-center gap-1 text-muted-foreground"><KeyRound size={14} /> No credentials displayed</span>
      </div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="grid gap-3 md:grid-cols-2">
        {capabilities.map(item => (
          <div key={item.id} className="rounded-xl border border-border bg-background p-4">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <strong className="text-sm">{labels[item.id]?.[0] || item.id}</strong>
              <span className={'flex items-center gap-1 text-xs font-semibold ' + (item.ready ? 'text-green-600' : 'text-amber-600')}>
                {item.ready ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}{item.ready ? 'Ready' : 'Needs connection'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{labels[item.id]?.[1] || item.provider}</p>
            {!item.ready && <p className="mt-2 text-xs text-muted-foreground">Missing binding: {(item.missing || []).join(', ')}</p>}
            {item.ready && (item.id === 'studio.templates.list' || item.id === 'vault.accounts.list') && (
              <button type="button" disabled={checking === item.id} onClick={() => inspect(item.id)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
                {checking === item.id ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />} Inspect metadata
              </button>
            )}
          </div>
        ))}
      </div>
      {detail && <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex justify-between gap-3"><strong className="text-sm">{labels[detail.capability]?.[0]}: {detail.items.length} records</strong><button type="button" onClick={() => setDetail(null)} className="text-sm text-primary underline">Close</button></div>
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">{detail.items.map(item => <li key={item.id} className="rounded-lg bg-background px-3 py-2"><strong>{item.title || item.name || item.id}</strong> <span className="text-muted-foreground">{item.provider || item.gallery_name || ''}</span></li>)}</ul>
        {detail.items.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No records are available for this account.</p>}
      </div>}
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">A ready backend binding does not mean ChatGPT OAuth is linked. One-time consent and tool authorization are still required for GPT access. <a className="inline-flex items-center gap-1 text-primary underline" href="https://developers.openai.com/plugins/build/auth" target="_blank" rel="noopener noreferrer">Connection requirements <ArrowUpRight size={12} /></a></p>
    </section>
  );
}
