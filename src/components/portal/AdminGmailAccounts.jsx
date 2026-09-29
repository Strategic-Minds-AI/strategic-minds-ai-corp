import { gmailAccounts } from './adminGmailConnectors';
import useAdminGmailAccounts from './useAdminGmailAccounts';
import AdminGmailAccountRow from './AdminGmailAccountRow';
import AdminGmailRecent from './AdminGmailRecent';
import { base44 } from '@/api/base44Client';

export default function AdminGmailAccounts() {
  const { status, selected, authorized, error, busy, connect, disconnect, select, refresh } = useAdminGmailAccounts();
  return <section aria-labelledby="gmail-heading" className="space-y-4">
    <div><h2 id="gmail-heading" className="mb-2 text-xl">Gmail accounts</h2><p className="text-sm text-muted-foreground">Connect a different Gmail address to each slot, then select one to view its recent mail here. Existing automated CRM follow-ups continue to use their currently connected sender.</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {authorized === null ? <p role="status" className="text-sm">Checking sign-in…</p> : !authorized ? <button type="button" onClick={() => base44.auth.redirectToLogin()} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in to connect Gmail</button> : <>
      <ul className="space-y-2">{gmailAccounts.map(account => <AdminGmailAccountRow key={account.id} account={account} state={status[account.id]} active={selected === account.id} busy={busy === account.id ? busy : busy ? 'another' : ''} onConnect={() => connect(account.id)} onDisconnect={() => disconnect(account.id)} onSelect={() => select(account.id)} />)}</ul>
      {selected && status[selected]?.connected && <AdminGmailRecent connectorId={selected} />}
      {Object.values(status).some(item => item?.error) && <button type="button" onClick={() => gmailAccounts.forEach(account => refresh(account.id))} className="text-xs font-medium text-primary underline">Retry account checks</button>}
    </>}
  </section>;
}