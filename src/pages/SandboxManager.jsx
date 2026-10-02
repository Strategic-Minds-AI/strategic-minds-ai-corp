import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Server, Cloud, Loader2, AlertCircle, ArrowLeft, RefreshCw, Cpu, Key, Copy, Check, X, Activity, Heart, ListTodo, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SandboxHealthBadge from '@/components/sandbox/SandboxHealthBadge';
import SandboxTaskDispatcher from '@/components/sandbox/SandboxTaskDispatcher';
import SandboxWorkerSetup from '@/components/sandbox/SandboxWorkerSetup';

export default function SandboxManager() {
  const [sandboxes, setSandboxes] = useState([]);
  const [railwayEnvs, setRailwayEnvs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [queueSummary, setQueueSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', environment: 'local', agent_name: '', description: '' });
  const [newApiKey, setNewApiKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [tab, setTab] = useState('sandboxes');
  const [healthChecking, setHealthChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sbRes, taskRes, queueRes] = await Promise.all([
        base44.functions.invoke('manageSandboxes', { action: 'list' }),
        base44.functions.invoke('dispatchAgentTask', { action: 'list', limit: 50 }),
        base44.functions.invoke('dispatchAgentTask', { action: 'queue_summary' }).catch(() => ({ data: { queues: {} } })),
      ]);
      setSandboxes(sbRes.data?.sandboxes || []);
      setRailwayEnvs(sbRes.data?.railway_environments || []);
      if (sbRes.data?.railway_error) setError(`Railway: ${sbRes.data.railway_error}`);
      setTasks(taskRes.data?.tasks || []);
      setQueueSummary(queueRes.data?.queues || {});
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
      const res = await base44.functions.invoke('manageSandboxes', { action, ...form });
      setNewApiKey(res.data?.api_key || null);
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

  const runHealthCheck = async () => {
    setHealthChecking(true);
    try {
      // Use the app's function endpoint with admin auth via SDK
      await base44.functions.invoke('manageSandboxes', { action: 'health_check' }).catch(() => {});
      await load();
    } catch (e) {
      setError(e.message);
    }
    setHealthChecking(false);
  };

  const healthy = sandboxes.filter(s => (s.health_status || 'unknown') === 'healthy').length;
  const degraded = sandboxes.filter(s => s.health_status === 'degraded').length;
  const offline = sandboxes.filter(s => s.health_status === 'offline').length;
  const unknown = sandboxes.filter(s => !s.health_status || s.health_status === 'unknown').length;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <Link to="/agents" className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></Link>
        <Cpu size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Sandbox System</span>
        <button onClick={runHealthCheck} disabled={healthChecking} className="ml-auto flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-40" title="Run health check">
          {healthChecking ? <Loader2 size={14} className="animate-spin"/> : <Heart size={14}/>} Health Check
        </button>
        <button onClick={load} className="rounded-lg p-2 text-foreground hover:bg-muted" title="Refresh"><RefreshCw size={16} /></button>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-lg bg-consoleAccent px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus size={16}/> New Sandbox</button>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Health summary */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Activity size={14} className="text-green-600"/><span className="text-[10px] font-bold uppercase text-muted-foreground">Healthy</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{healthy}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Activity size={14} className="text-amber-600"/><span className="text-[10px] font-bold uppercase text-muted-foreground">Degraded</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{degraded}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Activity size={14} className="text-destructive"/><span className="text-[10px] font-bold uppercase text-muted-foreground">Offline</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{offline}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Activity size={14} className="text-muted-foreground"/><span className="text-[10px] font-bold uppercase text-muted-foreground">No Heartbeat</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{unknown}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-border">
          <button onClick={() => setTab('sandboxes')} className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === 'sandboxes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}><Cpu size={15}/> Sandboxes ({sandboxes.length})</button>
          <button onClick={() => setTab('tasks')} className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}><ListTodo size={15}/> Task Queue ({tasks.length})</button>
          <button onClick={() => setTab('dispatch')} className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === 'dispatch' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}><Zap size={15}/> Dispatch</button>
        </div>

        {newApiKey && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Key size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Sandbox API Key — copy this to your Railway environment variables as SANDBOX_API_KEY</span>
              <button onClick={() => setNewApiKey(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={16}/></button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">{newApiKey}</code>
              <button onClick={() => { navigator.clipboard.writeText(newApiKey); setCopiedId('new'); setTimeout(() => setCopiedId(null), 2000); }} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
                {copiedId === 'new' ? <Check size={14} className="text-primary"/> : <Copy size={14}/>}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">This key is shown <strong className="text-foreground">once</strong> — only a SHA-256 hash is stored. Endpoint: <code className="text-foreground">https://strategic-ai-consulting.base44.app/functions/sandboxAuth</code></p>
          </div>
        )}

        {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle size={16}/> {error}</div>}

        {showCreate && tab === 'sandboxes' && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Create Sandbox</h2>
            <div className="space-y-3">
              <input className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Sandbox name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...form, environment: 'local' })} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${form.environment === 'local' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><Cpu size={14}/> Local</button>
                <button onClick={() => setForm({ ...form, environment: 'railway' })} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${form.environment === 'railway' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><Cloud size={14}/> Railway</button>
              </div>
              <input className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Agent name (e.g. orchestrator, growth, code)" value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} />
              <input className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <button onClick={create} disabled={creating || !form.name.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
                {creating ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Create {form.environment === 'railway' ? 'Railway' : 'Local'} Sandbox
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 size={24} className="animate-spin" /></div>
        ) : tab === 'sandboxes' ? (
          <>
            {sandboxes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No sandboxes yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {sandboxes.map(sb => (
                  <div key={sb.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${sb.environment === 'railway' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {sb.environment === 'railway' ? <Cloud size={18}/> : <Server size={18}/>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{sb.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${sb.status === 'active' ? 'bg-primary/10 text-primary' : sb.status === 'deleted' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}`}>{sb.status}</span>
                          <SandboxHealthBadge sandbox={sb} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sb.environment} {sb.agent_name ? `· ${sb.agent_name}` : ''} {sb.description ? `· ${sb.description}` : ''}
                          {sb.cycles_completed > 0 && ` · ${sb.cycles_completed} cycles`}
                        </div>
                        {sb.current_task_id && <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600"><Loader2 size={10} className="animate-spin"/> Executing task {sb.current_task_id.slice(0, 8)}...</div>}
                        {sb.last_error && <div className="mt-1 text-[11px] text-destructive truncate">Last error: {sb.last_error}</div>}
                        {sb.url && <a href={sb.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{sb.url}</a>}
                        {sb.key_prefix && (
                          <div className="mt-1 flex items-center gap-1">
                            <Key size={10} className="text-muted-foreground" />
                            <code className="text-[10px] text-muted-foreground">{sb.key_prefix}...</code>
                            <span className="text-[10px] text-muted-foreground italic">hashed</span>
                          </div>
                        )}
                      </div>
                      {sb.status !== 'deleted' && <button onClick={() => remove(sb.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 size={16}/></button>}
                    </div>
                    {sb.environment === 'railway' && <SandboxWorkerSetup sandbox={sb} />}
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
        ) : tab === 'tasks' ? (
          <>
            {/* Queue summary */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(queueSummary).length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground">No pending tasks in queue.</p>
              ) : (
                Object.entries(queueSummary).map(([agent, q]) => (
                  <div key={agent} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs font-semibold text-foreground">{agent}</p>
                    <p className="text-[11px] text-muted-foreground">{q.pending} pending · {q.in_progress} in progress</p>
                  </div>
                ))
              )}
            </div>

            {tasks.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No tasks yet. Dispatch a task from the Dispatch tab.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.status === 'pending' ? 'bg-muted text-muted-foreground' : t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-600' : t.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>{t.status}</span>
                      <span className="text-sm font-medium text-foreground">{t.title}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">{t.agent_name} · {t.task_type}</span>
                    </div>
                    {t.description && <p className="mt-1 text-xs text-muted-foreground truncate">{t.description}</p>}
                    {t.result && <p className="mt-1 text-[11px] text-muted-foreground truncate">Result: {t.result}</p>}
                    {t.claimed_by_sandbox_id && <p className="mt-1 text-[10px] text-muted-foreground">Claimed by: {t.claimed_by_sandbox_id.slice(0, 8)}...</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <SandboxTaskDispatcher onDispatched={load} />
        )}
      </div>
    </div>
  );
}