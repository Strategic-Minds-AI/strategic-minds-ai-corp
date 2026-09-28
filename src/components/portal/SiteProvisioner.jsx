import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function SiteProvisioner({ clients }) {
  const [organizations, setOrganizations] = useState([]);
  const [sites, setSites] = useState([]);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  useEffect(() => {
    base44.functions.invoke('provisionCustomerDatabase', { action: 'list' })
      .then(({ data }) => { setOrganizations(data.organizations); setSites(data.sites); if (data.organizations.length === 1) setOrgSlug(data.organizations[0].slug); })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, []);
  const create = async (event) => {
    event.preventDefault(); setError(''); setResult(null); setPending(true);
    try {
      const { data } = await base44.functions.invoke('provisionCustomerDatabase', { action: 'create', name: name.trim(), clientId, organizationSlug: orgSlug });
      setSites(previous => [data.site, ...previous]); setResult(data); setName(''); setClientId(''); setAccepted(false);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Provisioning failed.');
      if (e.response?.data?.project_ref) setResult({ site: { supabase_ref: e.response.data.project_ref }, db_password: e.response.data.db_password });
    } finally { setPending(false); }
  };
  return <section className="mb-8 rounded border border-border bg-card p-6">
    <h2 className="mb-2 text-xl">Customer databases</h2>
    <p className="mb-5 text-sm text-muted-foreground">Create a separate Supabase project for a registered client. This provisions a database, not a website or domain.</p>
    {loading ? <p role="status">Loading Supabase organizations…</p> : <>
      <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">Site name<input className="agency-input" value={name} onChange={e => setName(e.target.value)} required minLength={3} maxLength={120} disabled={pending} /></label>
        <label className="text-sm">Client<select className="agency-input" value={clientId} onChange={e => setClientId(e.target.value)} required disabled={pending}><option value="">Select a registered client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email} ({c.email})</option>)}</select></label>
        <label className="text-sm">Supabase organization<select className="agency-input" value={orgSlug} onChange={e => setOrgSlug(e.target.value)} required disabled={pending}><option value="">Select organization</option>{organizations.map(o => <option key={o.slug} value={o.slug}>{o.name}</option>)}</select></label>
        <label className="flex items-center gap-3 self-end text-sm"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required disabled={pending} />I understand this may incur Supabase charges.</label>
        <button className="agency-button md:justify-self-start" disabled={pending || !accepted || !clients.length || !organizations.length}>{pending ? 'Creating project…' : 'Create Supabase project'}</button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {result && <div role="status" className="mt-5 rounded border border-primary bg-muted p-4 text-sm"><strong>Save these details now.</strong> The database password is shown only once.<p className="mt-2">Project reference: <code>{result.site.supabase_ref}</code></p><p className="mt-2 break-all">Database password: <code>{result.db_password}</code></p><button type="button" className="mt-2 text-primary underline" onClick={() => navigator.clipboard.writeText(result.db_password)}>Copy password</button></div>}
      <h3 className="mb-3 mt-8 text-base">Provisioned projects</h3>
      {sites.length ? <ul className="divide-y divide-border">{sites.map(site => <li key={site.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><strong>{site.name}</strong> · {clients.find(c => c.id === site.client_id)?.email || 'Client'}</span><a className="text-primary underline" href={`https://supabase.com/dashboard/project/${encodeURIComponent(site.supabase_ref)}`} target="_blank" rel="noopener noreferrer">Open in Supabase</a></li>)}</ul> : <p className="text-sm text-muted-foreground">No customer databases provisioned here yet.</p>}
    </>}
  </section>;
}