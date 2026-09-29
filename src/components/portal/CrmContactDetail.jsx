import { useState } from 'react';
import { base44 } from '@/api/base44Client';

const asLocal = value => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
export default function CrmContactDetail({ contact, onChange }) {
  const [status, setStatus] = useState(contact.status || 'new');
  const [notes, setNotes] = useState(contact.notes || '');
  const [subject, setSubject] = useState(contact.follow_up_subject || '');
  const [body, setBody] = useState(contact.follow_up_body || '');
  const [when, setWhen] = useState(asLocal(contact.follow_up_at));
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  async function act(label, run) {
    setBusy(label); setError(''); setNotice('');
    try { await run(); setNotice(`${label} complete.`); await onChange(); }
    catch (err) { setError(err.response?.data?.error || err.message || `${label} failed`); }
    finally { setBusy(''); }
  }
  const save = () => act('Save', () => base44.entities.CrmContact.update(contact.id, { status, notes, follow_up_subject: subject, follow_up_body: body }));
  const schedule = () => {
    if (!when || new Date(when).getTime() <= Date.now() || !subject.trim() || !body.trim()) { setError('Choose a future time and write a subject and message.'); return; }
    act('Schedule', () => base44.entities.CrmContact.update(contact.id, { status, notes, follow_up_subject: subject.trim(), follow_up_body: body.trim(), follow_up_at: new Date(when).toISOString(), follow_up_status: 'scheduled' }));
  };
  const draft = () => act('AI draft', async () => { const res = await base44.functions.invoke('crmAssist', { contactId: contact.id }); setSubject(res.data.subject); setBody(res.data.body); });
  const remove = () => { if (window.confirm(`Remove ${contact.name} from the CRM?`)) act('Remove', async () => { await base44.entities.CrmContact.delete(contact.id); onChange(null); }); };
  return <section className="space-y-4 rounded border border-border bg-card p-5" aria-label="Contact details">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="mb-1 text-xl">{contact.name}</h3><a href={`mailto:${contact.email}`} className="text-sm text-primary">{contact.email}</a>{contact.phone && <p className="text-sm">{contact.phone}</p>}</div><span className="text-xs text-muted-foreground">{contact.source || 'Admin'} · {contact.follow_up_status || 'paused'}</span></div>
    <label className="block text-sm">Stage<select className="agency-input" value={status} onChange={e => setStatus(e.target.value)}>{['new','contacted','qualified','closed'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    <label className="block text-sm">Notes<textarea className="agency-input min-h-20" value={notes} onChange={e => setNotes(e.target.value)} maxLength={5000} /></label>
    <div className="border-t border-border pt-4"><h4 className="mb-2 text-base">Email follow-up</h4><p className="mb-4 text-sm text-muted-foreground">Review the message and choose when to send it. Website inquiries suggest a follow-up two days later; review and schedule it to activate sending.</p>
    <label className="block text-sm">Send at<input type="datetime-local" className="agency-input" value={when} onChange={e => setWhen(e.target.value)} /></label>
    <label className="mt-3 block text-sm">Subject<input className="agency-input" value={subject} onChange={e => setSubject(e.target.value)} maxLength={180} /></label>
    <label className="mt-3 block text-sm">Message<textarea className="agency-input min-h-36" value={body} onChange={e => setBody(e.target.value)} maxLength={5000} /></label></div>
    {contact.last_sent_at && <p className="text-xs text-muted-foreground">Last sent: {new Date(contact.last_sent_at).toLocaleString()}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-primary">{notice}</p>}
    <div className="flex flex-wrap gap-2"><button className="agency-button" disabled={!!busy} onClick={save}>Save details</button><button className="agency-button" disabled={!!busy} onClick={schedule}>{busy === 'Schedule' ? 'Scheduling…' : 'Schedule email'}</button><button className="rounded border border-border px-4 py-2 text-sm" disabled={!!busy} onClick={draft}>{busy === 'AI draft' ? 'Drafting…' : 'Draft with AI'}</button>{contact.follow_up_status === 'scheduled' && <button className="rounded border border-border px-4 py-2 text-sm" disabled={!!busy} onClick={() => act('Pause', () => base44.entities.CrmContact.update(contact.id, { follow_up_status: 'paused' }))}>Pause</button>}<button className="rounded border border-border px-4 py-2 text-sm text-destructive" disabled={!!busy} onClick={remove}>Remove</button></div>
  </section>;
}