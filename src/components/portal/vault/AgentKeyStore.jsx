import { useState, useEffect, useCallback } from 'react';
import { KeyRound, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff, ShieldCheck, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = [
  { value: 'api_key', label: 'API Key' },
  { value: 'token', label: 'Token' },
  { value: 'password', label: 'Password' },
  { value: 'connection_string', label: 'Connection String' },
  { value: 'webhook_secret', label: 'Webhook Secret' },
  { value: 'other', label: 'Other' },
];

export default function AgentKeyStore() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('agentSecrets', { action: 'list' });
      setSecrets(res.data?.secrets || []);
    } catch (e) { setError(e.response?.data?.error || e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(name) {
    if (!confirm(`Delete the secret "${name}"? The agent will no longer be able to use it.`)) return;
    try {
      await base44.functions.invoke('agentSecrets', { action: 'delete', name });
      load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
  }

  const filtered = secrets.filter(s =>
    !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><KeyRound size={22} /></span>
          <div>
            <h2 className="text-lg font-bold">Agent Key Store</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Securely store API keys, tokens, and credentials your agent can retrieve at runtime. Secrets are encrypted server-side (AES-256-GCM) and never appear in chat history.</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="xa-btn-primary text-xs whitespace-nowrap">
          <Plus size={15} /> Add key
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="animate-spin" size={22} /></div>
      ) : secrets.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-10 text-center">
          <ShieldCheck size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No keys stored yet. Add a key to let your agent use it securely.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keys…" className="xa-input pl-9" />
          </div>
          <div className="space-y-2">
            {filtered.map(secret => (
              <div key={secret.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-primary">{secret.name}</code>
                    <span className="text-xs text-muted-foreground">{CATEGORIES.find(c => c.value === secret.category)?.label || secret.category}</span>
                  </div>
                  {secret.description && <p className="mt-1 truncate text-xs text-muted-foreground">{secret.description}</p>}
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {secret.used_count > 0 && <span>Used {secret.used_count}×</span>}
                    {secret.last_used && <span>Last used {new Date(secret.last_used).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(secret.name)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${secret.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && <SecretForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </section>
  );
}

function SecretForm({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('api_key');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim() || !value.trim()) { setError('Name and value are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await base44.functions.invoke('agentSecrets', {
        action: 'store',
        name: name.trim(),
        value: value.trim(),
        description: description.trim(),
        category,
      });
      if (res.data?.error) throw new Error(res.data.error);
      onSaved();
    } catch (e) { setError(e.response?.data?.error || e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={handleSave} className="w-full max-w-lg rounded-xl bg-card border border-border p-6" onClick={e => e.stopPropagation()}>
        <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold"><KeyRound size={20} className="text-primary" /> Store a secret for the agent</h3>
        <p className="mb-4 text-xs text-muted-foreground">The agent can retrieve this by name at runtime. The value is encrypted server-side and never logged.</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Key name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. OPENAI_API_KEY" className="xa-input font-mono"
              autoCapitalize="characters" autoCorrect="off" spellCheck={false} />
            <p className="mt-1 text-xs text-muted-foreground">Uppercase, no spaces. The agent references this exact name.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Secret value</label>
            <div className="relative">
              <input
                type={showValue ? 'text' : 'password'}
                value={value} onChange={e => setValue(e.target.value)}
                placeholder="Paste the key, token, or credential"
                className="xa-input pr-10 font-mono"
                autoCorrect="off" spellCheck={false}
              />
              <button type="button" onClick={() => setShowValue(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showValue ? 'Hide value' : 'Show value'}>
                {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="xa-input">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description (optional)</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this key for?" className="xa-input" />
            </div>
          </div>
        </div>

        {error && <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive"><AlertTriangle size={15} /> {error}</div>}

        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={saving} className="xa-btn-primary flex-1">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Encrypting…</> : <><ShieldCheck size={16} /> Encrypt & store</>}
          </button>
          <button type="button" onClick={onClose} className="xa-btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}