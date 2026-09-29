import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import VaultCopy from '@/components/portal/vault/VaultCopy';
const endpoint = 'https://strategic-ai-consulting.base44.app/functions/vaultDirectory';
export default function VaultAccessKeys() {
  const [keys, setKeys] = useState(null); const [label, setLabel] = useState(''); const [days, setDays] = useState(30); const [token, setToken] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function load() {
    try { const { data } = await base44.functions.invoke('vaultKeyAdmin', { action: 'list' }); setKeys(data.keys); } catch (failure) { setError(failure.response?.data?.error || failure.message); }
  }
  useEffect(() => { load(); }, []);
  async function create(event) {
    event.preventDefault(); setBusy(true); setError(''); setToken('');
    try { const { data } = await base44.functions.invoke('vaultKeyAdmin', { action: 'create', label, days }); setToken(data.token); setLabel(''); await load(); }
    catch (failure) { setError(failure.response?.data?.error || failure.message); } finally { setBusy(false); }
  }
  async function revoke(id) {
    if (!window.confirm('Revoke this access key immediately?')) return; setBusy(true); setError('');
    try { await base44.functions.invoke('vaultKeyAdmin', { action: 'revoke', id }); setToken(''); await load(); }
    catch (failure) { setError(failure.response?.data?.error || failure.message); } finally { setBusy(false); }
  }
  return <section className="space-y-5"><h2 className="mb-0 text-xl">App access keys</h2><p className="text-sm text-muted-foreground">These keys read only your saved account directory—not provider credentials, files, code, or production systems. They are not GitHub, Railway, or Supabase API keys. Only a hash is stored.</p><form onSubmit={create} className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Key label<input required maxLength={100} value={label} onChange={e => setLabel(e.target.value)} className="agency-input"/></label><label className="text-sm">Expires after<select value={days} onChange={e => setDays(Number(e.target.value))} className="agency-input">{[7,30,90].map(value => <option key={value} value={value}>{value} days</option>)}</select></label><button type="submit" disabled={busy} className="agency-button sm:col-span-2">{busy ? 'Working…' : 'Generate access key'}</button></form>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {token && <div className="space-y-3 rounded-lg border border-primary bg-muted p-4"><p className="mb-0 text-xs">Copy this key now. It cannot be retrieved after leaving this screen.</p><textarea aria-label="New access key" readOnly value={token} rows={2} className="w-full break-all rounded border border-border bg-background p-3 font-mono text-xs text-foreground"/><VaultCopy value={token}/><button type="button" onClick={() => setToken('')} className="ml-3 text-xs text-primary underline">Hide key</button></div>}
    <div className="space-y-2 rounded-lg border border-border p-4"><p className="mb-0 text-xs font-semibold text-foreground">Use in an external integration</p><p className="break-all font-mono text-xs">POST {endpoint}</p><p className="text-xs">Send your key in the X-Vault-Key header, with JSON body {JSON.stringify({ offset: 0 })}. Follow next_offset for additional pages.</p><VaultCopy value={endpoint} label="Copy endpoint"/></div>
    {!keys ? <p role="status">Loading keys…</p> : !keys.length ? <p className="text-sm">No app access keys yet.</p> : <ul className="space-y-3">{keys.map(key => <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-border p-3 text-sm"><div><strong className="text-foreground">{key.label}</strong><p className="mb-0 text-xs">{key.prefix}… · {key.revoked ? 'Revoked' : Date.parse(key.expires_at) <= Date.now() ? 'Expired' : 'Active'} · {new Date(key.expires_at).toLocaleDateString()}</p></div>{!key.revoked && <button type="button" disabled={busy} onClick={() => revoke(key.id)} className="text-xs text-destructive underline">Revoke</button>}</li>)}</ul>}
  </section>;
}