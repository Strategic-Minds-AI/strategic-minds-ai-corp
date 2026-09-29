import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function CrmGooglePanel({ contact, contacts, onChange }) {
  const [events, setEvents] = useState([]); const [people, setPeople] = useState([]);
  const [start, setStart] = useState(''); const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  async function call(action, extra = {}) { const res = await base44.functions.invoke('crmGoogle', { action, ...extra }); return res.data; }
  async function run(label, fn) { setBusy(label); setError(''); setNotice(''); try { await fn(); setNotice(`${label} complete.`); } catch (e) { setError(e.message || `${label} failed`); } finally { setBusy(''); } }
  useEffect(() => { let active = true; call('listCalendar').then(data => { if (active) setEvents(data.events); }).catch(e => { if (active) setError(e.message || 'Could not load calendar.'); }); return () => { active = false; }; }, []);
  const addCall = () => {
    if (!contact || !start || new Date(start).getTime() <= Date.now()) { setError('Select a contact and a future call time.'); return; }
    run('Calendar call', async () => { await call('createCall', { contactId: contact.id, start: new Date(start).toISOString() }); setStart(''); setEvents((await call('listCalendar')).events); onChange(); });
  };
  const importPerson = person => run('Import contact', async () => { const created = await base44.entities.CrmContact.create({ name: person.name, email: person.email, phone: person.phone, google_resource_name: person.resourceName, source: 'Google Contacts', status: 'new', follow_up_status: 'paused' }); onChange(created.id); });
  return <section className="grid gap-5 lg:grid-cols-2" aria-label="Google account tools">
    <div className="rounded border border-border bg-card p-5"><h3 className="mb-2 text-lg">Google Calendar</h3><p className="mb-4 text-sm text-muted-foreground">Your next events, from the shared agency calendar.</p>{events.length ? <ul className="mb-4 space-y-2 text-sm">{events.map(event => <li key={event.id}><a href={event.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{event.title || 'Untitled event'}</a><span className="block text-muted-foreground">{new Date(event.start).toLocaleString()}</span></li>)}</ul> : <p className="mb-4 text-sm text-muted-foreground">No upcoming events.</p>}
      <label className="block text-sm">Schedule a 30-minute call with {contact?.name || 'a selected contact'}<input className="agency-input" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} /></label><button className="agency-button mt-3" disabled={!contact || !!busy} onClick={addCall}>Add call to calendar</button>
    </div>
    <div className="rounded border border-border bg-card p-5"><h3 className="mb-2 text-lg">Google Contacts</h3><p className="mb-4 text-sm text-muted-foreground">Save a selected CRM contact or import someone from your address book.</p><div className="flex flex-wrap gap-2"><button className="agency-button" disabled={!contact || !!busy || !!contact.google_resource_name} onClick={() => run('Save contact', async () => { await call('saveContact', { contactId: contact.id }); onChange(); })}>{contact?.google_resource_name ? 'Saved to Google' : 'Save selected contact'}</button><button className="rounded border border-border px-4 py-2 text-sm" disabled={!!busy} onClick={() => run('Load contacts', async () => setPeople((await call('listContacts')).contacts))}>Browse Google Contacts</button></div>
      {people.length > 0 && <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto text-sm">{people.map(person => <li key={person.resourceName} className="flex items-center justify-between gap-3 border-b border-border py-2"><span>{person.name}<span className="block text-muted-foreground">{person.email}</span></span><button className="text-primary disabled:opacity-50" disabled={!!busy || contacts.some(c => c.email.toLowerCase() === person.email.toLowerCase())} onClick={() => importPerson(person)}>Import</button></li>)}</ul>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive lg:col-span-2">{error}</p>}{notice && <p role="status" className="text-sm text-primary lg:col-span-2">{notice}</p>}
  </section>;
}