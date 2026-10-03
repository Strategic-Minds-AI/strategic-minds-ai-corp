import { useState, useEffect, useCallback } from 'react';
import { Database, Cloud, GitBranch, Server, KeyRound, Check, X, Loader2, Plus, ExternalLink } from 'lucide-react';
import useSecureVault from '@/components/portal/vault/useSecureVault';
import VaultUnlock from '@/components/portal/vault/VaultUnlock';

const BACKEND_SERVICES = [
  { id: 'supabase', label: 'Supabase', icon: Database, fields: ['Project URL', 'Anon Key', 'Service Role Key'], env: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'] },
  { id: 'vercel', label: 'Vercel', icon: Cloud, fields: ['API Token'], env: ['VERCEL_API_TOKEN'] },
  { id: 'railway', label: 'Railway', icon: Server, fields: ['API Token'], env: ['RAILWAY_API_TOKEN'] },
  { id: 'github', label: 'GitHub', icon: GitBranch, fields: ['Personal Access Token'], env: ['GITHUB_TOKEN'] },
  { id: 'openai', label: 'OpenAI / ChatGPT', icon: KeyRound, fields: ['API Key', 'Organization ID (optional)'], env: ['OPENAI_API_KEY', 'OPENAI_ORG_ID'] },
  { id: 'godaddy', label: 'GoDaddy', icon: ExternalLink, fields: ['API Key', 'API Secret'], env: ['GODADDY_API_KEY', 'GODADDY_API_SECRET'] },
  { id: 'twilio', label: 'Twilio', icon: KeyRound, fields: ['Account SID', 'Auth Token', 'Phone Number'], env: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'] },
  { id: 'stripe', label: 'Stripe', icon: KeyRound, fields: ['Secret Key', 'Publishable Key'], env: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'] },
];

export default function BackendConnections() {
  const vault = useSecureVault();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState({});
  const [showForm, setShowForm] = useState(null);

  const loadEntries = useCallback(async () => {
    if (!vault.unlocked) return;
    setLoading(true);
    try {
      // Read all vault entries and filter for backend service providers
      const { base44 } = await import('@/api/base44Client');
      const res = await base44.entities.VaultAccount.filter({}, { sort: '-created_date', limit: 100, fields: ['name', 'provider', 'connector_id', 'management_url'] });
      setEntries(res.items || []);
    } catch { /* vault entries are stored separately */ }
    setLoading(false);
  }, [vault.unlocked]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function testConnection(serviceId) {
    setTesting(serviceId);
    setTestResult(r => ({ ...r, [serviceId]: 'testing' }));
    try {
      // Check if the env vars are configured on the backend
      const { callFunction } = await import('@/lib/functionClient');
      const res = await callFunction('gptSync', { action: 'status' }).catch(() => ({}));
      // For non-GPT services, check if env exists via a simple health probe
      const envConfigured = serviceId === 'openai' ? res.configured : Boolean(process.env?.[BACKEND_SERVICES.find(s => s.id === serviceId)?.env?.[0]]);
      setTestResult(r => ({ ...r, [serviceId]: envConfigured ? 'ok' : 'missing' }));
    } catch { setTestResult(r => ({ ...r, [serviceId]: 'missing' })); }
    setTesting(null);
  }

  if (vault.error) return <p role="alert" className="text-sm text-destructive">{vault.error}</p>;
  if (vault.settings === undefined) return <p role="status" className="py-8 text-center">Loading vault…</p>;
  if (!vault.unlocked) return <VaultUnlock creating={!vault.settings} onUnlock={async pw => { await vault.unlock(pw); }} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="agency-eyebrow mb-1">API VAULT</p>
          <h2 className="text-xl font-semibold">Backend service connections</h2>
          <p className="text-sm text-muted-foreground mt-1">Store credentials for Supabase, Vercel, Railway, GitHub, OpenAI, and other systems your backend connects to. Secrets are encrypted and never exposed to the frontend.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BACKEND_SERVICES.map(svc => {
          const Icon = svc.icon;
          const status = testResult[svc.id];
          const connected = entries.some(e => e.provider === svc.id || e.name?.toLowerCase().includes(svc.label.toLowerCase()));
          return (
            <div key={svc.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="xa-icon-chip"><Icon size={20} /></span>
                  <div>
                    <strong className="block text-sm">{svc.label}</strong>
                    <span className="text-xs text-muted-foreground">{svc.fields.length} field{svc.fields.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
                {status === 'ok' && <span className="flex items-center gap-1 text-xs text-green"><Check size={14} /> Live</span>}
                {status === 'missing' && <span className="flex items-center gap-1 text-xs text-muted-foreground"><X size={14} /> Not set</span>}
                {status === 'testing' && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(svc.id)} className="xa-btn-outline flex-1 text-xs">
                  <Plus size={14} /> {connected ? 'Update' : 'Add credentials'}
                </button>
                <button type="button" onClick={() => testConnection(svc.id)} disabled={testing === svc.id} className="rounded-lg border border-border px-3 text-xs hover:border-primary">
                  Test
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <BackendCredentialForm
          service={BACKEND_SERVICES.find(s => s.id === showForm)}
          vault={vault}
          onClose={() => setShowForm(null)}
          onSaved={() => { setShowForm(null); loadEntries(); }}
        />
      )}
    </div>
  );
}

function BackendCredentialForm({ service, vault, onClose, onSaved }) {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const secret = service.fields.map((f, i) => `${f}: ${values[f] || ''}`).join('\n');
      await vault.save({
        title: `${service.label} credentials`,
        provider: service.id,
        category: 'backend',
        secret,
        notes: `Env vars: ${service.env.join(', ')}`,
      });
      onSaved();
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-6" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <service.icon size={20} className="text-primary" /> {service.label}
        </h3>
        <div className="space-y-3">
          {service.fields.map(field => (
            <div key={field}>
              <label className="mb-1 block text-sm font-medium">{field}</label>
              <input
                type={field.toLowerCase().includes('key') || field.toLowerCase().includes('token') || field.toLowerCase().includes('secret') ? 'password' : 'text'}
                value={values[field] || ''}
                onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
                className="xa-input"
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Stored encrypted in your vault. To activate live connections, also set these as backend environment variables in your deployment settings.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={handleSave} disabled={saving} className="xa-btn-primary flex-1">{saving ? 'Saving…' : 'Save to vault'}</button>
          <button type="button" onClick={onClose} className="xa-btn-outline">Cancel</button>
        </div>
      </div>
    </div>
  );
}