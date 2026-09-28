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
  const load = useCallback(async () => {
    try { const { data } = await base44.functions.invoke('provisionClientInfrastructure', { action: 'list' }); setItems(data.items); setError(''); }
    catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async (values) => {
    setPending('create'); setError('');
    try { const { data } = await base44.functions.invoke('provisionClientInfrastructure', { action: 'create', ...values }); setItems(previous => [data.item, ...previous]); return true; }
    catch (e) { setError(e.response?.data?.error || e.message); return false; }
    finally { setPending(''); }
  };
  const run = async (id, action) => {
    setPending(`${id}:${action}`); setError('');
    try { const { data } = await base44.functions.invoke('provisionClientInfrastructure', { id, action, workspaceId }); setItems(previous => previous.map(item => item.id === id ? data.item : item)); }
    catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setPending(''); }
  };
  return <section className="mb-8 rounded border border-border bg-card p-6">
    <h2 className="mb-2 text-xl">Client infrastructure</h2>
    <p className="mb-5 text-sm text-muted-foreground">Create an agency-owned private repository, then connect projects in Vercel and Railway. Projects can incur provider charges; adding source code and deployment settings comes next.</p>
    <InfrastructureForm clients={clients} onCreate={create} pending={!!pending} />
    <label className="mb-4 block text-sm">Railway workspace ID <span className="text-muted-foreground">(optional for account tokens; enter it for workspace-scoped tokens)</span><input className="agency-input md:max-w-md" value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} disabled={!!pending} /></label>
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error} <button type="button" onClick={load} className="underline">Refresh</button></p>}
    {loading ? <p role="status">Loading client infrastructure…</p> : items.length ? <ul>{items.map(item => <InfrastructureRow key={item.id} item={item} clients={clients} pending={pending} onRun={run} />)}</ul> : <p className="text-sm text-muted-foreground">No client infrastructure projects yet.</p>}
  </section>;
}