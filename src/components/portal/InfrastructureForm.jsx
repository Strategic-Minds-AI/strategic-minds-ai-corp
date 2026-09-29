import { useState } from 'react';

export default function InfrastructureForm({ clients, onCreate, pending }) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [capabilities, setCapabilities] = useState(['code', 'data']);
  const toggle = (value) => setCapabilities(current => current.includes(value) ? current.filter(x => x !== value) : [...current, value]);
  const submit = async (event) => {
    event.preventDefault();
    const success = await onCreate({ name: name.trim(), clientId, capabilities });
    if (success) { setName(''); setClientId(''); setCapabilities(['code', 'data']); }
  };
  return <form onSubmit={submit} className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
    <label className="text-sm">Project name<input className="agency-input" value={name} onChange={e => setName(e.target.value)} minLength={3} maxLength={80} required disabled={pending} /></label>
    <label className="text-sm">Client<select className="agency-input" value={clientId} onChange={e => setClientId(e.target.value)} required disabled={pending}><option value="">Select registered client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email} ({c.email})</option>)}</select></label>
    <fieldset className="md:col-span-3"><legend className="mb-2 text-sm font-medium text-foreground">Provisionable capabilities</legend><div className="flex flex-wrap gap-5">{[['code', 'Code · private repository'], ['data', 'Data · separate database']].map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={capabilities.includes(value)} onChange={() => toggle(value)} disabled={pending} />{label}</label>)}</div><p className="mt-1 text-xs text-muted-foreground">Code and Data are the first provisionable options. Overview, App Users, Analytics, Marketing, Domains, Integrations, Security, Agents, Workflows, Logs, API, Settings, and MCP are not enabled by this setup. These resources do not yet deploy an application.</p></fieldset>
    <button className="agency-button md:col-span-3 md:justify-self-start" disabled={pending || !clients.length || !capabilities.length}>{pending ? 'Saving…' : 'Add client app workspace'}</button>
  </form>;
}