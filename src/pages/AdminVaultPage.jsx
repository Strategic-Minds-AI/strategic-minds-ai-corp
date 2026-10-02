import AdminShell from '@/components/portal/AdminShell';
import CredentialsVault from '@/components/portal/vault/CredentialsVault';
export default function AdminVaultPage() {
  return <AdminShell><div className="mb-8"><p className="agency-eyebrow mb-2">ADMIN VAULT</p><h1 className="mb-3">Secure vault</h1><p className="text-sm text-muted-foreground">Encrypted passwords, API keys, account details and private notes, with secure backup and restore.</p></div><CredentialsVault/></AdminShell>;
}