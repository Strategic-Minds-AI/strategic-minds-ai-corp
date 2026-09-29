import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { gmailAccounts } from './adminGmailConnectors';

export default function useAdminGmailAccounts() {
  const [status, setStatus] = useState({});
  const [selected, setSelected] = useState('');
  const [authorized, setAuthorized] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const timers = useRef([]);
  async function refresh(id) {
    try {
      const { data } = await base44.functions.invoke('adminGmailAccount', { connectorId: id });
      setStatus(previous => ({ ...previous, [id]: { connected: true, email: data.email } }));
    } catch (failure) {
      const missing = failure.response?.status === 409;
      setStatus(previous => ({ ...previous, [id]: { connected: false, error: missing ? '' : (failure.response?.data?.error || failure.message) } }));
    }
  }
  useEffect(() => {
    let mounted = true;
    base44.auth.isAuthenticated().then(async authed => {
      if (!mounted) return;
      setAuthorized(authed);
      if (!authed) return;
      const user = await base44.auth.me();
      if (mounted) setSelected(user.active_gmail_connector_id || '');
      await Promise.all(gmailAccounts.map(account => refresh(account.id)));
    }).catch(failure => { if (mounted) setError(failure.message || 'Could not load accounts.'); });
    return () => { mounted = false; timers.current.forEach(clearInterval); };
  }, []);
  async function connect(id) {
    const popup = window.open('', '_blank');
    if (!popup) { setError('Allow pop-ups to connect an inbox.'); return; }
    setBusy(id); setError('');
    try {
      const url = await base44.connectors.connectAppUser(id);
      popup.location.replace(url);
      const timer = setInterval(() => {
        if (popup.closed) { clearInterval(timer); timers.current = timers.current.filter(t => t !== timer); refresh(id).finally(() => setBusy('')); }
      }, 500);
      timers.current.push(timer);
    } catch (failure) { popup.close(); setError(failure.message || 'Could not start Gmail connection.'); setBusy(''); }
  }
  async function disconnect(id) {
    if (!window.confirm('Disconnect this Gmail inbox?')) return;
    setBusy(id); setError('');
    try {
      await base44.connectors.disconnectAppUser(id);
      if (selected === id) { await base44.auth.updateMe({ active_gmail_connector_id: '' }); setSelected(''); }
      setStatus(previous => ({ ...previous, [id]: { connected: false } }));
    } catch (failure) { setError(failure.message || 'Could not disconnect Gmail.'); }
    finally { setBusy(''); }
  }
  async function select(id) {
    setBusy(id); setError('');
    try { await base44.auth.updateMe({ active_gmail_connector_id: id }); setSelected(id); }
    catch (failure) { setError(failure.message || 'Could not select inbox.'); }
    finally { setBusy(''); }
  }
  return { status, selected, authorized, error, busy, connect, disconnect, select, refresh };
}