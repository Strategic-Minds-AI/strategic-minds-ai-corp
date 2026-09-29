import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import GoogleCalendarEvents from '@/components/portal/GoogleCalendarEvents';
export default function AgencyCalendar() {
  const [events,setEvents] = useState([]), [loading,setLoading] = useState(true), [error,setError] = useState('');
  async function load() { setLoading(true); setError(''); try { const { data } = await base44.functions.invoke('crmGoogle', { action: 'listCalendar' }); setEvents(data.events.map(event => ({ ...event, summary: event.title, htmlLink: event.url }))); } catch (failure) { setError(failure.response?.data?.error || failure.message || 'Could not load the agency Calendar.'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  return <section className="space-y-4 rounded-lg border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="mb-0 text-lg">Agency meetings & deadlines</h2><button type="button" onClick={load} disabled={loading} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-50">Refresh calendar</button></div><p className="mb-0 text-xs text-muted-foreground">The next 100 events from your connected agency account’s primary Google Calendar. Project deadlines appear here when added to this calendar; dates are not inferred from project notes.</p>{loading ? <p role="status" className="text-sm">Loading agency Calendar…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <GoogleCalendarEvents events={events}/>}</section>;
}