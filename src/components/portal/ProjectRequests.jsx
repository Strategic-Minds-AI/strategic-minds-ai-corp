import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ProjectRequests({ project, requests, admin, onDone }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const send = async (event) => {
    event.preventDefault(); setPending(true); setError('');
    try {
      await base44.entities.ProjectRequest.create({ project_id: project.id, client_id: project.client_id, message: message.trim(), status: 'Open', reply: '' });
      setMessage(''); await onDone();
    } catch (e) { setError(e.message || 'Could not send your request.'); }
    finally { setPending(false); }
  };
  const resolve = async (request, reply) => {
    setPending(true); setError('');
    try { await base44.entities.ProjectRequest.update(request.id, { reply, status: 'Resolved' }); await onDone(); }
    catch (e) { setError(e.message || 'Could not reply.'); }
    finally { setPending(false); }
  };
  return <section className="rounded border border-border bg-card p-6">
    <h3 className="mb-4 text-xl">Requests</h3>
    {!admin && <form onSubmit={send} className="mb-6 space-y-3"><label htmlFor="request-message" className="text-sm">Ask your team a question or request work</label><textarea id="request-message" required minLength={3} maxLength={3000} className="agency-input min-h-24" value={message} onChange={e => setMessage(e.target.value)} disabled={pending} /><button className="agency-button" disabled={pending}>{pending ? 'Sending…' : 'Send request'}</button></form>}
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    {!requests.length ? <p className="text-sm text-muted-foreground">No requests yet.</p> : <div className="space-y-4">{requests.map(request => <RequestItem key={request.id} request={request} admin={admin} pending={pending} onResolve={resolve} />)}</div>}
  </section>;
}

function RequestItem({ request, admin, pending, onResolve }) {
  const [reply, setReply] = useState(request.reply || '');
  return <div className="border-t border-border pt-4"><span className="text-xs font-semibold uppercase tracking-wide text-primary">{request.status || 'Open'}</span><p className="my-2 whitespace-pre-wrap text-sm">{request.message}</p>{request.reply && <p className="rounded bg-muted p-3 text-sm">Team reply: {request.reply}</p>}{admin && request.status !== 'Resolved' && <form onSubmit={e => { e.preventDefault(); onResolve(request, reply.trim()); }} className="mt-3 space-y-2"><label className="block text-sm" htmlFor={`reply-${request.id}`}>Reply</label><textarea id={`reply-${request.id}`} required minLength={2} maxLength={3000} className="agency-input min-h-20" value={reply} onChange={e => setReply(e.target.value)} disabled={pending} /><button className="agency-button" disabled={pending}>{pending ? 'Saving…' : 'Reply and resolve'}</button></form>}</div>;
}