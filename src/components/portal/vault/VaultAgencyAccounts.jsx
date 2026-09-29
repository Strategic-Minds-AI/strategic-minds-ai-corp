import { useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function VaultAgencyAccounts({ onOpen }) {
  const [result, setResult] = useState(null); const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  async function inspect(provider) {
    setBusy(provider); setError(''); setResult(null);
    try { const { data } = await base44.functions.invoke(provider === 'drive' ? 'agencyDriveIngest' : 'adminAccountOverview', provider === 'drive' ? { action: 'recentFiles' } : { provider }); setResult({ provider, count: provider === 'drive' ? data.files.length : data.items.length }); }
    catch (failure) { setError(failure.response?.data?.error || failure.message || 'Connection could not be verified.'); }
    finally { setBusy(''); }
  }
  return <section className="space-y-4"><h2 className="mb-0 text-xl">Existing agency connections</h2><p className="text-sm text-muted-foreground">Check the existing shared accounts without displaying credentials.</p><div className="grid gap-2 sm:grid-cols-2">{[['github','GitHub'],['supabase','Supabase'],['railway','Railway'],['vercel','Vercel'],['drive','Google Drive']].map(([id,label]) => <button key={id} type="button" disabled={!!busy} onClick={() => inspect(id)} className="flex items-center justify-between rounded border border-border bg-card p-3 text-left text-sm text-foreground disabled:opacity-50"><span>{label}</span><span className="text-xs text-primary">{busy === id ? 'Checking…' : 'Check access'}</span></button>)}</div>{result && <p role="status" className="text-xs text-muted-foreground">{result.provider}: access verified; {result.count} recent resources returned.</p>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex flex-wrap gap-4 text-xs"><button type="button" onClick={() => onOpen('settings')} className="text-primary underline">Manage Gmail accounts</button><button type="button" onClick={() => onOpen('google-workspace')} className="text-primary underline">Open Google Workspace</button><button type="button" onClick={() => onOpen('crm')} className="text-primary underline">Contacts & CRM</button></div></section>;
}