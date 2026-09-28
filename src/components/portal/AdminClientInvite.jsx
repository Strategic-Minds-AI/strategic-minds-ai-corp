import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminClientInvite({ onDone }) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const invite = async (event) => {
    event.preventDefault(); setPending(true); setMessage('');
    try {
      await base44.users.inviteUser(email.trim(), 'user');
      setEmail(''); setMessage('Invitation sent. Once your client joins, you can assign them a project.');
      await onDone();
    } catch (e) { setMessage(e.message || 'Could not send the invitation.'); }
    finally { setPending(false); }
  };
  return <form onSubmit={invite} className="rounded border border-border bg-card p-6">
    <h2 className="mb-2 text-xl">Invite a client</h2>
    <p className="mb-4 text-sm text-muted-foreground">Clients receive access to their assigned projects only.</p>
    <label className="text-sm" htmlFor="invite-email">Email address</label>
    <input id="invite-email" className="agency-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={pending} />
    <button className="agency-button mt-4" disabled={pending}>{pending ? 'Sending…' : 'Send invitation'}</button>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </form>;
}