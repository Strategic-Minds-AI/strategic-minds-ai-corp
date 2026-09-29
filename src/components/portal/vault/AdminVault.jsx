import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import VaultAccounts from '@/components/portal/vault/VaultAccounts';
import VaultAccessKeys from '@/components/portal/vault/VaultAccessKeys';
import VaultGenerators from '@/components/portal/vault/VaultGenerators';
import VaultApiDraft from '@/components/portal/vault/VaultApiDraft';
import ChatGPTConnection from '@/components/portal/ChatGPTConnection';
import VaultBackups from '@/components/portal/vault/VaultBackups';
const sections = [['accounts','Accounts'],['keys','API keys'],['backups','Encrypted backups'],['generators','Generators'],['mcp','MCP & ChatGPT']];
export default function AdminVault({ onOpen, onDraft }) {
  const { user } = useAuth(); const [section, setSection] = useState('accounts');
  if (user?.role !== 'admin') return <p role="alert">Admin access required.</p>;
  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="agency-eyebrow mb-2">SETTINGS</p><h1 className="mb-2 text-2xl">Account & API vault</h1><p className="text-sm text-muted-foreground">An admin-only account directory, OAuth connections, and credential generators. Raw provider secrets are not stored here.</p></div><nav aria-label="Vault sections" className="flex flex-wrap gap-2 border-b border-border pb-4">{sections.map(([id,label]) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)} className={section === id ? 'rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground' : 'rounded-lg bg-muted px-4 py-2 text-xs font-medium text-foreground'}>{label}</button>)}</nav>{section === 'accounts' && <VaultAccounts onOpen={onOpen}/>} {section === 'keys' && <VaultAccessKeys/>}{section === 'backups' && <VaultBackups/>}{section === 'generators' && <div className="space-y-7"><VaultGenerators/><VaultApiDraft onDraft={onDraft}/></div>}{section === 'mcp' && <div className="space-y-4"><p className="text-sm text-muted-foreground">The read-only vault-directory tool is available through the agency’s OAuth-protected MCP server after republishing. It returns account references only—never passwords or access keys. Existing admin chat supports API code drafting, not autonomous sandbox execution.</p><ChatGPTConnection/></div>}</div>;
}