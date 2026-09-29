import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { vaultProviders } from '@/components/portal/vault/vaultProviders';
export default function useVaultAccounts() {
  const [accounts, setAccounts] = useState(null); const [signedIn, setSignedIn] = useState(null); const [status, setStatus] = useState({}); const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const timers = useRef([]);
  async function check(id) {
    try { const { data } = await base44.functions.invoke('vaultConnection', { connectorId: id }); setStatus(previous => ({ ...previous, [id]: data })); }
    catch (failure) { setStatus(previous => ({ ...previous, [id]: { connected: false, error: failure.response?.status === 409 ? '' : failure.response?.data?.error || failure.message } })); }
  }
  async function load() {
    setError('');
    try { const records = await base44.entities.VaultAccount.list('-created_date', 100); setAccounts(records); await Promise.all([...new Set(records.map(item => item.connector_id).filter(Boolean))].map(check)); }
    catch (failure) { setError(failure.message || 'Could not load accounts.'); }
  }
  useEffect(() => { base44.auth.isAuthenticated().then(value => { setSignedIn(value); if (value) load(); }).catch(failure => setError(failure.message)); return () => timers.current.forEach(clearInterval); }, []);
  async function save(values) {
    setError(''); setBusy('save');
    try {
      if (values.management_url) { const url = new URL(values.management_url); if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Use an HTTPS dashboard URL without credentials, query parameters, or fragments.'); values.management_url = url.href; }
      const provider = vaultProviders.find(item => item.id === values.provider);
      if (values.connector_id && values.connector_id !== provider?.connectorId) throw new Error('Invalid connection slot.');
      if (values.connector_id && accounts.some(item => item.connector_id === values.connector_id)) throw new Error('That OAuth slot is already in your vault. Another simultaneous account needs another registered slot.');
      await base44.entities.VaultAccount.create(values); await load(); return true;
    } catch (failure) { setError(failure.message || 'Could not save account.'); return false; }
    finally { setBusy(''); }
  }
  async function connect(id) {
    const popup = window.open('', '_blank'); if (!popup) { setError('Allow pop-ups to connect this account.'); return; } setBusy(id); setError('');
    try { popup.location.replace(await base44.connectors.connectAppUser(id)); const timer = setInterval(() => { if (popup.closed) { clearInterval(timer); timers.current = timers.current.filter(item => item !== timer); check(id).finally(() => setBusy('')); } }, 500); timers.current.push(timer); }
    catch (failure) { popup.close(); setError(failure.message || 'Connection failed.'); setBusy(''); }
  }
  async function disconnect(id) {
    if (!window.confirm('Disconnect this personal OAuth account?')) return; setBusy(id); setError('');
    try { await base44.connectors.disconnectAppUser(id); setStatus(previous => ({ ...previous, [id]: { connected: false } })); }
    catch (failure) { setError(failure.message); } finally { setBusy(''); }
  }
  async function remove(account) {
    if (!window.confirm('Remove this account reference? Its OAuth connection will not be revoked; disconnect it first if needed.')) return;
    setBusy(account.id); setError(''); try { await base44.entities.VaultAccount.delete(account.id); await load(); } catch (failure) { setError(failure.message); } finally { setBusy(''); }
  }
  return { accounts, signedIn, status, busy, error, save, connect, disconnect, remove, load };
}