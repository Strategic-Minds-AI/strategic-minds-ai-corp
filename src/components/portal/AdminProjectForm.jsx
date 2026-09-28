import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminProjectForm({ clients, onDone }) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const create = async (event) => {
    event.preventDefault(); setPending(true); setError('');
    try {
      await base44.entities.ClientProject.create({ title: title.trim(), client_id: clientId, status: 'Planning', progress_note: '' });
      setTitle(''); setClientId(''); await onDone();
    } catch (e) { setError(e.message || 'Could not create the project.'); }
    finally { setPending(false); }
  };
  return <form onSubmit={create} className="rounded border border-border bg-card p-6">
    <h2 className="mb-2 text-xl">Create a project</h2>
    <p className="mb-4 text-sm text-muted-foreground">Assign a registered client to share progress privately.</p>
    <label htmlFor="project-title" className="text-sm">Project name</label>
    <input id="project-title" className="agency-input" required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} disabled={pending} />
    <label htmlFor="project-client" className="mt-3 block text-sm">Client</label>
    <select id="project-client" className="agency-input" required value={clientId} onChange={e => setClientId(e.target.value)} disabled={pending || !clients.length}><option value="">Select a client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email} ({c.email})</option>)}</select>
    {!clients.length && <p className="mt-2 text-sm text-muted-foreground">Invite a client first; they will appear here after joining.</p>}
    <button className="agency-button mt-4" disabled={pending || !clients.length}>{pending ? 'Creating…' : 'Create project'}</button>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </form>;
}