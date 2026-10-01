import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Server, Cloud, Loader2, AlertCircle, ArrowLeft, RefreshCw, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SandboxManager() {
  const [sandboxes, setSandboxes] = useState([]);
  const [railwayEnvs, setRailwayEnvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', environment: 'local', agent_name: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('manageSandboxes', { action: 'list' });
      setSandboxes(res.data?.sandboxes || []);
      setRailwayEnvs(res.data?.railway_environments || []);
      if (res.data?.railway_error) setError(`Railway: ${res.data.railway_error}`);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const action = form.environment === 'railway' ? 'create_railway' : 'create_local';
      await base44.functions.invoke('manageSandboxes', { action, ...form });
      setForm({ name: '', environment: 'local', agent_name: '', description: '' });
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setCreating(false);
  };

  const remove = async (id) => {
    try {
      await base44.functions.invoke('manageSandboxes', { action: 'delete', sandbox_id: id });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <Link to="/agents" className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></Link>
        <Cpu size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Sandbox System</span>
        <button onClick={load} className="ml-auto rounded-lg p-2 text-foreground hover:bg-muted" title="Refresh"><RefreshCw size={16} /></button>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-lg bg-consoleAccent px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus size={16}/> New Sandbox</button>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle size={16}/> {error}</div>}

        {showCreate && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Create Sandbox</h2>
            <div className="space-y-3">
              <input className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Sandbox name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...form, environment: 'local' })} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${form.environment === 'local' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><Cpu size={14}/> Local</button>
                <button onClick={() => setForm({ ...form, environment: 'railway' })} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${form.environment === 'railway' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><Cloud size={14}/> Railway</button>
              </div>
              <input className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Agent name (optional)" value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} />
              <input className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <button onClick={create} disabled={creating || !form.name.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
                {creating ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Create {form.environment === 'railway' ? 'Railway' : 'Local'} Sandbox
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 size={24} className="animate-spin" /></div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sandboxes ({sandboxes.length})</h2>
            </div>
            {sandboxes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No sandboxes yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {sandboxes.map(sb => (
                  <div key={sb.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${sb.environment === 'railway' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {sb.environment === 'railway' ? <Cloud size={18}/> : <Server size={18}/>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{sb.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${sb.status === 'active' ? 'bg-primary/10 text-primary' : sb.status === 'deleted' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}`}>{sb.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{sb.environment} {sb.agent_name ? `· ${sb.agent_name}` : ''} {sb.description ? `· ${sb.description}` : ''}</div>
                      {sb.url && <a href={sb.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{sb.url}</a>}
                    </div>
                    {sb.status !== 'deleted' && <button onClick={() => remove(sb.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 size={16}/></button>}
                  </div>
                ))}
              </div>
            )}

            {railwayEnvs.length > 0 && (
              <>
                <div className="mb-4 mt-8">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Railway Environments ({railwayEnvs.length})</h2>
                </div>
                <div className="space-y-2">
                  {railwayEnvs.map(env => (
                    <div key={env.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                      <Cloud size={14} className="text-primary" />
                      <span className="font-medium text-foreground">{env.name}</span>
                      {env.isEphemeral && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Ephemeral</span>}
                      <span className="ml-auto text-xs text-muted-foreground">{env.id.slice(0, 8)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}