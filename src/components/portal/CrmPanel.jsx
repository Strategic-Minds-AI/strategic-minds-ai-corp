import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CrmContactForm from './CrmContactForm';
import CrmContactDetail from './CrmContactDetail';
import CrmGooglePanel from './CrmGooglePanel';

export default function CrmPanel() {
  const [contacts, setContacts] = useState([]); const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState('');
  const refresh = useCallback(async id => {
    try { const items = await base44.entities.CrmContact.list('-created_date', 200); setContacts(items); if (id !== undefined) setSelectedId(id); setError(''); }
    catch (err) { setError(err.message || 'Could not load CRM contacts.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const selected = contacts.find(c => c.id === selectedId);
  const filtered = contacts.filter(c => `${c.name} ${c.email} ${c.phone || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="mb-12 space-y-5 border-t border-border pt-10" aria-label="Agency CRM">
    <div><p className="agency-eyebrow">ADMIN / RELATIONSHIPS</p><h2 className="mb-1 text-2xl">AI-assisted CRM</h2><p className="text-sm text-muted-foreground">Contact inquiries appear here automatically. Review and schedule a follow-up to send through your shared Gmail account; pause or edit it anytime.</p></div>
    <CrmContactForm onAdded={refresh} />
    {error && <p role="alert" className="text-sm text-destructive">{error} <button className="underline" onClick={() => refresh()}>Retry</button></p>}
    {loading ? <p role="status">Loading contacts…</p> : <div className="grid gap-5 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
      <div className="rounded border border-border bg-card p-4"><label className="block text-sm">Find a contact<input className="agency-input mb-4" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, email or phone" /></label>{filtered.length ? <div className="max-h-[560px] space-y-2 overflow-y-auto">{filtered.map(contact => <button key={contact.id} type="button" onClick={() => setSelectedId(contact.id)} className={`w-full rounded border p-3 text-left text-sm ${selectedId === contact.id ? 'border-primary bg-muted' : 'border-border hover:border-primary'}`}><strong className="block text-foreground">{contact.name}</strong><span className="block text-muted-foreground">{contact.email}</span><span className="text-xs text-primary">{contact.status} · {contact.follow_up_status || 'paused'}</span></button>)}</div> : <p className="text-sm text-muted-foreground">{contacts.length ? 'No matching contacts.' : 'No contacts yet. Add one above or receive a contact inquiry.'}</p>}</div>
      {selected ? <CrmContactDetail key={selected.id} contact={selected} onChange={refresh} /> : <div className="rounded border border-border bg-card p-6 text-sm text-muted-foreground">Select a contact to manage notes and follow-ups.</div>}
    </div>}
    <CrmGooglePanel contact={selected} contacts={contacts} onChange={refresh} />
  </section>;
}