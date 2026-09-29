import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { hashVaultKey } from '../../shared/vaultKeys.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req); let ownerId;
    const token = req.headers.get('X-Vault-Key');
    if (token !== null) {
      if (!/^smv_[a-f0-9]{64}$/.test(token)) return Response.json({ error: 'Invalid access key.' }, { status: 401 });
      const keys = await base44.asServiceRole.entities.VaultAccessKey.filter({ token_hash: await hashVaultKey(token), revoked: false, scope: 'directory:read' }, '-created_date', 1);
      const key = keys[0];
      if (!key || !Number.isFinite(Date.parse(key.expires_at)) || Date.parse(key.expires_at) <= Date.now()) return Response.json({ error: 'Invalid or expired access key.' }, { status: 401 });
      const issuer = await base44.asServiceRole.entities.User.get(key.owner_id);
      if (!issuer || issuer.role !== 'admin') return Response.json({ error: 'Access key is no longer authorized.' }, { status: 403 });
      ownerId = key.owner_id;
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Sign in or provide X-Vault-Key.' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
      ownerId = user.id;
    }
    const body = req.method === 'GET' ? {} : await req.json();
    const offset = body.offset === undefined ? 0 : body.offset;
    if (!Number.isInteger(offset) || offset < 0 || offset > 10000) return Response.json({ error: 'Offset must be an integer from 0 to 10000.' }, { status: 400 });
    const records = await base44.asServiceRole.entities.VaultAccount.filter({ created_by_id: ownerId }, '-created_date', 51, offset);
    return Response.json({ accounts: records.slice(0, 50).map((account: any) => ({ id: account.id, name: account.name, provider: account.provider, management_url: account.management_url || '', connection_type: account.connector_id ? 'personal_oauth_slot' : 'reference_only' })), next_offset: records.length > 50 ? offset + 50 : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Directory unavailable.' }, { status: 500 }); }
}