import { useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function GoogleCalendarCreate({ onCreated }) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await base44.functions.invoke('adminPersonalCalendar', { action: 'create', title, start: new Date(start).toISOString(), end: new Date(end).toISOString() }); setTitle(''); setStart(''); setEnd(''); onCreated(); }
    catch (failure) { setError(failure.response?.data?.error || failure.message || 'Could not create event.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-3 border-t border-border pt-4"><h3 className="mb-1 text-base">New event</h3><input aria-label="Event title" required maxLength={200} placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"/><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Starts<input type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"/></label><label className="text-xs">Ends<input type="datetime-local" required value={end} min={start} onChange={e => setEnd(e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"/></label></div>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<button type="submit" disabled={busy} className="rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{busy ? 'Creating…' : 'Create event'}</button></form>;
}