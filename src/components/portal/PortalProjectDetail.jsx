import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ProjectRequests from '@/components/portal/ProjectRequests';

export default function PortalProjectDetail({ project, requests, admin, onDone }) {
  const [status, setStatus] = useState(project.status || 'Planning');
  const [note, setNote] = useState(project.progress_note || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const save = async (event) => {
    event.preventDefault(); setPending(true); setError('');
    try { await base44.entities.ClientProject.update(project.id, { status, progress_note: note }); await onDone(); }
    catch (e) { setError(e.message || 'Could not save progress.'); }
    finally { setPending(false); }
  };
  return <div className="space-y-5">
    <div className="rounded border border-border bg-card p-6">
      <h2 className="mb-2 text-2xl">{project.title}</h2>
      {admin ? <form onSubmit={save} key={project.id} className="space-y-3">
        <label htmlFor="progress-status" className="block text-sm">Status</label>
        <select id="progress-status" className="agency-input" value={status} onChange={e => setStatus(e.target.value)}>{['Planning', 'In progress', 'Review', 'Complete'].map(s => <option key={s}>{s}</option>)}</select>
        <label htmlFor="progress-note" className="block text-sm">Progress update</label>
        <textarea id="progress-note" className="agency-input min-h-24" maxLength={3000} value={note} onChange={e => setNote(e.target.value)} placeholder="What has changed?" />
        <button className="agency-button" disabled={pending}>{pending ? 'Saving…' : 'Save progress'}</button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </form> : <><p className="text-sm font-semibold text-primary">{project.status || 'Planning'}</p><p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{project.progress_note || 'Your team has not posted an update yet.'}</p></>}
    </div>
    <ProjectRequests project={project} requests={requests} admin={admin} onDone={onDone} />
  </div>;
}