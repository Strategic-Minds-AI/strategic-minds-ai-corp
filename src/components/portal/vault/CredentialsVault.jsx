import { useState } from 'react';
import { LockKeyhole, Plus, ShieldCheck, Upload } from 'lucide-react';
import useSecureVault from '@/components/portal/vault/useSecureVault';
import VaultUnlock from '@/components/portal/vault/VaultUnlock';
import CredentialForm from '@/components/portal/vault/CredentialForm';
import CredentialList from '@/components/portal/vault/CredentialList';
import CredentialBackupActions from '@/components/portal/vault/CredentialBackupActions';
import VaultIngester from '@/components/portal/vault/VaultIngester';
export default function CredentialsVault() {
  const vault = useSecureVault();
  const [editing, setEditing] = useState(undefined), [refresh, setRefresh] = useState(0), [ingester, setIngester] = useState(false);
  if (vault.error) return <p role="alert" className="text-sm text-destructive">{vault.error} <button type="button" onClick={vault.retry} className="text-primary underline">Retry vault access</button></p>;
  if (vault.settings === undefined) return <p role="status" className="py-8 text-center">Loading encrypted vault…</p>;
  if (!vault.unlocked) return <VaultUnlock creating={!vault.settings} onUnlock={async password => { await vault.unlock(password); setEditing(undefined); }}/>;
  const updated = () => setRefresh(value => value + 1);
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-2 text-sm text-primary"><ShieldCheck size={19}/>Encrypted credentials · Auto-lock enabled</div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => { setEditing(undefined); vault.lock(); }} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-4 text-sm"><LockKeyhole size={17}/>Lock vault</button><button type="button" onClick={() => setIngester(value => !value)} className={ingester ? 'inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-4 text-sm text-primary-foreground' : 'inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-4 text-sm'}><Upload size={17}/>Batch upload</button><button type="button" onClick={() => setEditing(null)} className="agency-button"><Plus size={17}/>Add item</button></div></div><p className="mb-0 text-sm text-muted-foreground">Save account logins, API keys and private notes. Existing connection secrets remain in their protected systems and are not copied automatically.</p>
{ingester && <VaultIngester vault={vault} onDone={() => { setIngester(false); updated(); }}/>}<CredentialList vault={vault} refresh={refresh} onAdd={() => setEditing(null)} onEdit={async item => setEditing(await vault.read(item.id))}/><CredentialBackupActions vault={vault} onRestored={updated}/>{editing !== undefined && <CredentialForm key={editing?.id || 'new'} entry={editing} onSave={async values => { await vault.save(values); updated(); }} onClose={() => setEditing(undefined)}/>}</div>;
}