import { base44 } from '@/api/base44Client';
import useVaultAccounts from '@/components/portal/vault/useVaultAccounts';
import VaultAccountForm from '@/components/portal/vault/VaultAccountForm';
import VaultAccountRow from '@/components/portal/vault/VaultAccountRow';
import VaultAgencyAccounts from '@/components/portal/vault/VaultAgencyAccounts';
export default function VaultAccounts({ onOpen }) {
  const state = useVaultAccounts();
  if (state.signedIn === null) return <p role="status">Loading account access…</p>;
  if (!state.signedIn) return <button type="button" onClick={() => base44.auth.redirectToLogin()} className="agency-button">Sign in</button>;
  return <div className="space-y-7"><VaultAgencyAccounts onOpen={onOpen}/><section className="space-y-4 border-t border-border pt-6"><div className="flex items-center justify-between"><h2 className="mb-0 text-xl">Additional accounts</h2><button type="button" onClick={state.load} className="text-xs text-primary underline">Refresh</button></div><p className="text-sm text-muted-foreground">Personal GitHub, Supabase, and Drive connections use existing OAuth slots. GitHub App installations, additional Railway accounts, E2B, and private sandboxes can be catalogued here but are reference-only until their secure integration is configured.</p>{state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{!state.accounts ? <p role="status">Loading accounts…</p> : <><VaultAccountForm onSave={state.save} busy={!!state.busy}/>{state.accounts.length ? <ul className="space-y-3">{state.accounts.map(account => <VaultAccountRow key={account.id} account={account} status={state.status[account.connector_id]} busy={!!state.busy} onConnect={state.connect} onDisconnect={state.disconnect} onRemove={state.remove}/>)}</ul> : <p className="text-sm">No additional accounts saved yet.</p>}</>}</section></div>;
}