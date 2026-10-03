import AdminShell from '@/components/portal/AdminShell';
import BackendConnections from '@/components/portal/vault/BackendConnections';
export default function ApiVaultPage() {
  return <AdminShell>
    <div className="mb-8">
      <p className="agency-eyebrow mb-2">API VAULT</p>
      <h1 className="mb-3">Backend service credentials</h1>
      <p className="text-sm text-muted-foreground">Encrypted storage for Supabase, Vercel, Railway, GitHub, OpenAI, and other backend system credentials. Secrets are encrypted at rest and never exposed to the frontend.</p>
    </div>
    <BackendConnections />
  </AdminShell>;
}