import { useState } from 'react';

export default function InfrastructureForm({ clients, onCreate, pending }) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    const success = await onCreate({ name: name.trim(), clientId });
    if (success) { setName(''); setClientId(''); }
  };
  return <form onSubmit={submit} className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
    <label className="text-sm">Project name<input className="agency-input" value={name} onChange={e => setName(e.target.value)} minLength={3} maxLength={80} required disabled={pending} /></label>
    <label className="text-sm">Client<select className="agency-input" value={clientId} onChange={e => setClientId(e.target.value)} required disabled={pending}><option value="">Select registered client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email} ({c.email})</option>)}</select></label>
    <button className="agency-button" disabled={pending || !clients.length}>{pending ? 'Saving…' : 'Add client project'}</button>
  </form>;
}