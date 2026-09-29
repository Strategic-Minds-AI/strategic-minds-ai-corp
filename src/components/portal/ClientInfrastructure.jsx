import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import InfrastructureForm from './InfrastructureForm';
import InfrastructureRow from './InfrastructureRow';

export default function ClientInfrastructure({ clients }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [orgSlug, setOrgSlug] = useState('');
  const [password, setPassword] = useState(null);
  const [chargeAccepted, setChargeAccepted] = useState(false);
  const load = useCallback(async () => {
    try { const { data } = await base44.functions.invoke('provisionClientInfrastructure', { action: 'list' }); setItems(data.items); setError(''); }
    catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    load();
    base44.functions.invoke('provisionCustomerDatabase', { action: 'list' })
      .then(({ data }) => { setOrganizations(data.organizations || []); if (data.organizations?.length === 1) setOrgSlug(data.organizations[0].slug); })
      .catch(e => setError(e.response?.data?.error || e.message));
  }, [load]);
  const create = async (values) => {
    setPending('create'); setError('');
    try { const { data } = await base44.functions.invoke('provisionClientInfrastructure', { action: 'create', ...values }); setItems(previous => [data.item, ...previous]); return true; }
    catch (e) { setError(e.response?.data?.error || e.message); return false; }
    finally { setPending(''); }
  };
  const run = async (id, action) => {
    setPending(`${id}:${action}`); setError('');
    try {
      if (action === 'data' && (!orgSlug || !chargeAccepted)) throw new Error('Choose a Supabase organization and acknowledge potential charges.');
      const current = items.find(item => item.id === id);
      const { data } = action === 'data'
        ? await base44.functions.invoke('provisionCustomerDatabase', { action: 'create', name: current.name, clientId: current.client_id, infrastructureId: id, organizationSlug: orgSlug })
        : await base44.functions.invoke('provisionClientInfrastructure', { id, action, workspaceId });
      setItems(previous => previous.map(item => item.id === id ? data.item : item));
      if (action === 'data') { setPassword({ name: current.name, ref: data.site.supabase_ref, value: data.db_password }); setChargeAccepted(false); }
    } catch (e) {
      const partial = e.response?.data;
      if (action === 'data' && partial?.project_ref && partial?.db_password) setPassword({ name: items.find(item => item.id === id)?.name || 'Database', ref: partial.project_ref, value: partial.db_password });
      setError(partial?.error || e.message);
    }
    finally { setPending(''); }
  };
  return <section className="mb-8 rounded border border-border bg-card p-6">
    <h2 className="mb-2 text-xl">Client App Provisioning</h2>
    <p className="mb-5 text-sm text-muted-foreground">Select Code and/or Data for a client, then create the corresponding agency-owned resources. Vercel and Railway project setup remains available for code workspaces. These resources may incur provider charges; application code and deployment settings are still separate steps.</p>
    <InfrastructureForm clients={clients} onCreate={create} pending={!!pending} />
    <div className="mb-4 grid gap-4 md:grid-cols-2"><label className="block text-sm">Supabase organization<select className="agency-input" value={orgSlug} onChange={e => setOrgSlug(e.target.value)} disabled={!!pending}><option value="">Select organization</option>{organizations.map(o => <option key={o.slug} value={o.slug}>{o.name}</option>)}</select></label><label className="block text-sm">Railway workspace ID <span className="text-muted-foreground">(optional for account tokens; enter it for workspace-scoped tokens)</span><input className="agency-input" value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} disabled={!!pending} /></label></div>
    <label className="mb-5 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={chargeAccepted} onChange={e => setChargeAccepted(e.target.checked)} disabled={!!pending} />I understand that creating a Supabase project may incur charges.</label>
    {password && <div role="status" className="mb-5 rounded border border-primary bg-muted p-4 text-sm"><strong>Save this database password now — it will not be shown again.</strong><p className="mt-2">{password.name} · {password.ref}</p><code className="mt-2 block break-all">{password.value}</code><button type="button" className="mt-2 text-primary underline" onClick={() => setPassword(null)}>Dismiss</button></div>}
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error} <button type="button" onClick={load} className="underline">Refresh</button></p>}
    {loading ? <p role="status">Loading client infrastructure…</p> : items.length ? <ul>{items.map(item => <InfrastructureRow key={item.id} item={item} clients={clients} pending={pending} onRun={run} canCreateData={!!orgSlug && chargeAccepted} />)}</ul> : <p className="text-sm text-muted-foreground">No client infrastructure projects yet.</p>}
  </section>;
}