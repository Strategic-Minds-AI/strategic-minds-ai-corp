import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';
import { encryptVault, decryptVault, vaultRows } from '../../shared/vaultBackupCrypto.ts';
import { backupDrive, backupFolder, privateBackupFile, uploadVaultBackup, driveQuery } from '../../shared/vaultBackupDrive.ts';
import { keyMetadata } from '../../shared/vaultKeys.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const body = await req.json();
    if (!['create', 'list', 'preview'].includes(body.action)) return Response.json({ error: 'Invalid backup action.' }, { status: 400 });
    const appId = secrets.get('BASE44_APP_ID');
    if (!appId) throw new Error('Backup application identity unavailable.');
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const folderId = await backupFolder(accessToken, appId, body.action === 'create');
    if (body.action === 'list') {
      if (!folderId) return Response.json({ files: [] }, { headers: { 'Cache-Control': 'no-store' } });
      const q = `trashed = false and '${driveQuery(folderId)}' in parents and appProperties has { key='sm_vault_backup' and value='${driveQuery(appId)}' } and appProperties has { key='owner_id' and value='${driveQuery(user.id)}' }`;
      const params = new URLSearchParams({ q, spaces: 'drive', orderBy: 'createdTime desc', pageSize: '30', fields: 'files(id,name,createdTime,size)' });
      const data = await backupDrive(accessToken, `files?${params}`);
      return Response.json({ files: data.files || [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (body.action === 'create') {
      const [accounts, accessKeys] = await Promise.all([
        vaultRows(base44.asServiceRole.entities.VaultAccount, { created_by_id: user.id }),
        vaultRows(base44.asServiceRole.entities.VaultAccessKey, { owner_id: user.id })
      ]);
      const snapshot = { version: 1, app_id: appId, owner_id: user.id, saved_at: new Date().toISOString(), accounts, access_keys: accessKeys };
      const encrypted = await encryptVault(snapshot, appId, user.id);
      const file = await uploadVaultBackup(accessToken, { name: `vault-${snapshot.saved_at.replace(/[:.]/g, '-')}.enc`, parents: [folderId], mimeType: 'application/octet-stream', appProperties: { sm_vault_backup: appId, owner_id: user.id } }, encrypted);
      return Response.json({ file, account_count: accounts.length, access_key_count: accessKeys.length, encrypted: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (!folderId || typeof body.fileId !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(body.fileId)) return Response.json({ error: 'Backup not found.' }, { status: 404 });
    const file = await privateBackupFile(accessToken, body.fileId);
    if (file.appProperties?.sm_vault_backup !== appId || file.appProperties?.owner_id !== user.id || !file.parents?.includes(folderId)) return Response.json({ error: 'Backup not available for your account.' }, { status: 403 });
    const envelope = await backupDrive(accessToken, `files/${encodeURIComponent(body.fileId)}?alt=media`);
    const snapshot = await decryptVault(envelope, appId, user.id);
    return Response.json({ snapshot: { saved_at: snapshot.saved_at, accounts: snapshot.accounts, access_keys: snapshot.access_keys.map(keyMetadata) } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error.message || 'Encrypted backup failed.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}