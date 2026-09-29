import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import GoogleCalendarEvents from './GoogleCalendarEvents';
import GoogleCalendarCreate from './GoogleCalendarCreate';
const connectorId = '6aa76cc2470fe12f80973720';
export default function GooglePersonalCalendar() {
  const [events, setEvents] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(null);
  const timer = useRef(null);
  async function load() {
    setLoading(true); setError('');
    try { const { data } = await base44.functions.invoke('adminPersonalCalendar', { action: 'list' }); setEvents(data.events); setConnected(true); }
    catch (failure) { setConnected(false); setError(failure.response?.status === 409 ? '' : (failure.response?.data?.error || failure.message)); }
    finally { setLoading(false); }
  }
  useEffect(() => { base44.auth.isAuthenticated().then(value => { setSignedIn(value); if (value) load(); }); return () => clearInterval(timer.current); }, []);
  async function connect() {
    const popup = window.open('', '_blank');
    if (!popup) { setError('Allow pop-ups to connect Calendar.'); return; }
    try { popup.location.replace(await base44.connectors.connectAppUser(connectorId)); timer.current = setInterval(() => { if (popup.closed) { clearInterval(timer.current); load(); } }, 500); }
    catch (failure) { popup.close(); setError(failure.message || 'Could not connect Calendar.'); }
  }
  async function disconnect() {
    try { await base44.connectors.disconnectAppUser(connectorId); setConnected(false); setEvents(null); }
    catch (failure) { setError(failure.message || 'Could not disconnect Calendar.'); }
  }
  return <section className="space-y-4 rounded-lg border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="mb-0 text-lg">Personal Calendar</h2>{connected && <button type="button" onClick={disconnect} className="text-xs text-destructive underline">Disconnect</button>}</div>
    {signedIn === null || loading ? <p role="status" className="text-sm">Loading Calendar…</p> : !signedIn ? <button type="button" onClick={() => base44.auth.redirectToLogin()} className="text-sm text-primary underline">Sign in to connect</button> : connected ? <><GoogleCalendarEvents events={events || []}/><GoogleCalendarCreate onCreated={load}/></> : <><p className="text-sm text-muted-foreground">Connect your own Google Calendar to see and create events.</p><button type="button" onClick={connect} className="rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Connect Calendar</button></>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}