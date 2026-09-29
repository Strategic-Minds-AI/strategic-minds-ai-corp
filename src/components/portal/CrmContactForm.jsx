import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function CrmContactForm({ onAdded }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function add(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    try {
      const contact = await base44.entities.CrmContact.create({ name: fields.name.trim(), email: fields.email.trim().toLowerCase(), phone: fields.phone.trim(), source: 'Admin', status: 'new', follow_up_status: 'paused' });
      form.reset(); onAdded(contact.id);
    } catch (err) { setError(err.message || 'Could not add contact'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={add} className="rounded border border-border bg-card p-5" aria-busy={busy}>
    <h3 className="mb-4 text-lg">Add a contact</h3>
    <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Name<input className="agency-input" name="name" required maxLength={120} /></label><label className="text-sm">Email<input className="agency-input" name="email" type="email" required maxLength={254} /></label><label className="text-sm">Phone<input className="agency-input" name="phone" type="tel" maxLength={50} /></label></div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <button className="agency-button mt-4" disabled={busy}>{busy ? 'Adding…' : 'Add contact'}</button>
  </form>;
}