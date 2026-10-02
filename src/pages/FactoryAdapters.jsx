import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Boxes, Loader2, Plus, Save, X, Activity } from 'lucide-react';
import { getAllAdapters, getAdapterSecrets } from '@/lib/universalFactory/adapters';

export default function FactoryAdapters() {
  const navigate = useNavigate();
  const [adapters, setAdapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegistry, setShowRegistry] = useState(false);
  const registryAdapters = getAllAdapters();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ adapter_key: '', name: '', version: '1.0.0', description: '', capabilities: [], secret_requirements: [], supports_rollback: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listAdapters' });
      setAdapters(res.data?.adapters || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.adapter_key || !form.name) return;
    setSaving(true);
    try {
      await base44.functions.invoke('factoryOS', { action: 'createAdapter', adapter: form });
      setShowForm(false);
      setForm({ adapter_key: '', name: '', version: '1.0.0', description: '', capabilities: [], secret_requirements: [], supports_rollback: false });
      await load();
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  const toggleEnabled = async (adapter) => {
    try {
      await base44.functions.invoke('factoryOS', { action: 'updateAdapter', id: adapter.id, enabled: !adapter.enabled });
      await load();
    } catch (e) { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Boxes size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Adapter Library</span>
        <button onClick={() => setShowRegistry(!showRegistry)} className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">Registry ({registryAdapters.length})</button>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
          {showForm ? <X size={14} /> : <Plus size={14} />}
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {showForm && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="adapter_key" value={form.adapter_key} onChange={(e) => setForm({ ...form, adapter_key: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="capabilities (comma-separated)" value={form.capabilities.join(',')} onChange={(e) => setForm({ ...form, capabilities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="secrets (comma-separated)" value={form.secret_requirements.join(',')} onChange={(e) => setForm({ ...form, secret_requirements: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.supports_rollback} onChange={(e) => setForm({ ...form, supports_rollback: e.target.checked })} /> Supports rollback
              </label>
            </div>
            <button onClick={save} disabled={saving} className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Adapter
            </button>
          </div>
        )}

        {showRegistry ? (
          <div className="space-y-2">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Built-in Adapter Registry ({registryAdapters.length})</h2>
            {registryAdapters.map((a) => {
              const secrets = getAdapterSecrets(a.adapter_id);
              return (
              <div key={a.adapter_id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-foreground">{a.adapter_id}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">v{a.version}</span>
                </div>
                {a.capabilities?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.capabilities.map((c) => <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>)}
                  </div>
                )}
                {a.actions?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {a.actions.map((act) => (
                      <div key={act.name} className="flex items-center gap-2 text-[10px]">
                        <span className="font-mono text-foreground">{act.name}</span>
                        <span className="rounded bg-muted px-1 py-0.5 text-muted-foreground">{act.risk_class}</span>
                        {act.requires_approval && <span className="text-yellow-600">approval</span>}
                      </div>
                    ))}
                  </div>
                )}
                {secrets.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {secrets.map((s) => <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>)}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : adapters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Boxes size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No adapters configured yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {adapters.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-foreground">{a.adapter_key}</span>
                  <span className="text-xs text-foreground">{a.name}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">v{a.version}</span>
                  <HealthBadge status={a.health_status} />
                  <button onClick={() => toggleEnabled(a)} className={`ml-auto rounded-full px-3 py-1 text-[10px] font-bold ${a.enabled ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {a.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                {a.description && <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>}
                {a.capabilities?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.capabilities.map((c) => <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>)}
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

function HealthBadge({ status }) {
  const styles = { healthy: 'bg-green-500/10 text-green-600', degraded: 'bg-yellow-500/10 text-yellow-600', offline: 'bg-destructive/10 text-destructive', not_configured: 'bg-muted text-muted-foreground', unknown: 'bg-muted text-muted-foreground' };
  return <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.unknown}`}><Activity size={10} />{status}</span>;
}