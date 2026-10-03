import { useState, useEffect, useCallback } from 'react';
import { KeyRound, Plus, Copy, Check, Trash2, Ban, Shield, Zap, Eye } from 'lucide-react';
import AdminShell from '@/components/portal/AdminShell';
import { functions } from '@/lib/functionClient';

const KEY_TYPES = [
  { value: 'admin', label: 'Admin — full read/write access', prefix: 'xa_admin_', color: 'text-destructive' },
  { value: 'vision_cortex', label: 'Vision Cortex — autonomous diagnostic & heal', prefix: 'xa_vision_', color: 'text-primary' },
  { value: 'user', label: 'User — read-only public data', prefix: 'xa_user_', color: 'text-muted-foreground' },
];

const PERMISSION_OPTIONS = ['all', 'diagnostics', 'heal', 'harden', 'optimize', 'read', 'write', 'provision', 'deploy', 'xps_catalog', 'prompt_library', 'lead_engine'];

export default function ApiGenerator() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState({ key_name: '', key_type: 'vision_cortex', permissions: [] });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = (await functions.invoke('manageApiKeys', { action: 'list' })).data;
      setKeys(res.keys || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  async function handleCreate() {
    if (!newKey.key_name.trim()) { setError('Give the key a name.'); return; }
    setCreating(true); setError('');
    try {
      const res = (await functions.invoke('manageApiKeys', { action: 'create', ...newKey })).data;
      setGeneratedKey(res.key);
      setNewKey({ key_name: '', key_type: 'vision_cortex', permissions: [] });
      loadKeys();
    } catch (e) { setError(e.message); }
    setCreating(false);
  }

  async function handleRevoke(id) {
    if (!confirm('Revoke this key? It will stop working immediately.')) return;
    try { await functions.invoke('manageApiKeys', { action: 'revoke', key_id: id }); loadKeys(); } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Permanently delete this key?')) return;
    try { await functions.invoke('manageApiKeys', { action: 'delete', key_id: id }); loadKeys(); } catch (e) { setError(e.message); }
  }

  function togglePermission(perm) {
    setNewKey(k => ({ ...k, permissions: k.permissions.includes(perm) ? k.permissions.filter(p => p !== perm) : [...k.permissions, perm] }));
  }

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="agency-eyebrow mb-2">API GENERATOR</p>
        <h1 className="mb-3">API keys for external apps</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">Generate API keys that let other apps and services connect to your backend. Each key has a type and permission scope. The full key value is shown only once at creation — copy it immediately.</p>
      </div>

      {error && <p role="alert" className="mb-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {generatedKey && (
        <div className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-primary"><KeyRound size={20} /><strong>Key created — copy it now</strong></div>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded bg-card px-4 py-3 text-sm font-mono break-all border border-border">{generatedKey.key_value}</code>
            <button type="button" onClick={() => { navigator.clipboard.writeText(generatedKey.key_value); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="agency-button shrink-0">
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">This key won't be shown again. Store it securely — you can revoke it anytime below.</p>
          <button type="button" onClick={() => setGeneratedKey(null)} className="mt-3 text-sm text-primary underline">Dismiss</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={19} /> Generate new key</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Key name</label>
              <input value={newKey.key_name} onChange={e => setNewKey(k => ({ ...k, key_name: e.target.value }))} placeholder="e.g. External CRM, Vision Cortex Prod" className="xa-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Key type</label>
              <select value={newKey.key_type} onChange={e => setNewKey(k => ({ ...k, key_type: e.target.value, permissions: [] }))} className="xa-input">
                {KEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_OPTIONS.map(perm => (
                  <button key={perm} type="button" onClick={() => togglePermission(perm)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${newKey.permissions.includes(perm) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>{perm}</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={handleCreate} disabled={creating} className="xa-btn-primary w-full">
              {creating ? 'Generating…' : 'Generate API key'}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><KeyRound size={19} /> Active keys ({keys.length})</h2>
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading keys…</p> : keys.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No API keys yet. Generate one on the left.</p>
          ) : (
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="flex items-center gap-4 rounded-lg border border-border p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">{k.key_name}</strong>
                      {k.key_type === 'admin' && <Shield size={14} className="text-destructive" />}
                      {k.key_type === 'vision_cortex' && <Zap size={14} className="text-primary" />}
                      {k.active ? <span className="rounded-full bg-green/15 px-2 py-0.5 text-xs text-green">active</span> : <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">revoked</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="font-mono">{k.key_prefix}…</code>
                      <span>· {k.key_type}</span>
                      {k.permissions?.length > 0 && <span>· {k.permissions.join(', ')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {k.active && <button type="button" onClick={() => handleRevoke(k.id)} title="Revoke" className="rounded-lg border border-border p-2 hover:border-destructive hover:text-destructive"><Ban size={16} /></button>}
                    <button type="button" onClick={() => handleDelete(k.id)} title="Delete" className="rounded-lg border border-border p-2 hover:border-destructive hover:text-destructive"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}