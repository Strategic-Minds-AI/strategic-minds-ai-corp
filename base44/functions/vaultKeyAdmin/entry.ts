import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { createVaultKey, hashVaultKey, keyMetadata } from '../../shared/vaultKeys.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const body = await req.json(); const entity = base44.asServiceRole.entities.VaultAccessKey;
    if (body.action === 'list') {
      const keys = await entity.filter({ owner_id: user.id }, '-created_date', 100);
      return Response.json({ keys: keys.map(keyMetadata) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (body.action === 'create') {
      if (typeof body.label !== 'string' || !body.label.trim() || body.label.length > 100 || ![7, 30, 90].includes(body.days)) return Response.json({ error: 'Provide a label and an expiry of 7, 30, or 90 days.' }, { status: 400 });
      const token = createVaultKey();
      const key = await entity.create({ owner_id: user.id, label: body.label.trim(), token_hash: await hashVaultKey(token), prefix: token.slice(0, 12), scope: 'directory:read', expires_at: new Date(Date.now() + body.days * 86400000).toISOString(), revoked: false });
      return Response.json({ key: keyMetadata(key), token }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (body.action === 'revoke') {
      if (typeof body.id !== 'string' || body.id.length > 100) return Response.json({ error: 'Invalid key.' }, { status: 400 });
      const keys = await entity.filter({ id: body.id, owner_id: user.id }, '-created_date', 1);
      if (!keys.length) return Response.json({ error: 'Key not found.' }, { status: 404 });
      await entity.update(keys[0].id, { revoked: true }); return Response.json({ revoked: true });
    }
    return Response.json({ error: 'Invalid key action.' }, { status: 400 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Key operation failed.' }, { status: 500 }); }
}