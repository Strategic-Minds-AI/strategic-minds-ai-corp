export function driveQuery(value) { return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
export async function backupDrive(accessToken, path, options = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, { ...options, headers: { Authorization: `Bearer ${accessToken}`, ...options.headers } });
  if (!response.ok) { const detail = await response.json(); throw new Error(detail.error?.message || 'Backup Drive request failed.'); }
  return await response.json();
}
export async function privateBackupFile(accessToken, id) {
  const metadata = await backupDrive(accessToken, `files/${encodeURIComponent(id)}?fields=id,ownedByMe,trashed,mimeType,parents,appProperties,name,createdTime`);
  if (!metadata.ownedByMe || metadata.trashed) throw new Error('The backup destination must be owned by the connected agency account.');
  let pageToken;
  do {
    const params = new URLSearchParams({ fields: 'permissions(role,type,deleted),nextPageToken', pageSize: '100' });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await backupDrive(accessToken, `files/${encodeURIComponent(id)}/permissions?${params}`);
    if ((page.permissions || []).some(permission => !permission.deleted && permission.role !== 'owner')) throw new Error('Backup access is blocked because this Drive item is shared. Remove sharing before using it.');
    pageToken = page.nextPageToken;
  } while (pageToken);
  return metadata;
}
export async function backupFolder(accessToken, appId, create = false) {
  const q = `trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='sm_vault_folder' and value='${driveQuery(appId)}' }`;
  const params = new URLSearchParams({ q, spaces: 'drive', fields: 'files(id)', pageSize: '1' });
  const list = await backupDrive(accessToken, `files?${params}`);
  let id = list.files?.[0]?.id;
  if (!id && !create) return null;
  if (!id) { const folder = await backupDrive(accessToken, 'files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Strategic Minds AI — Encrypted Vault Backups', mimeType: 'application/vnd.google-apps.folder', appProperties: { sm_vault_folder: appId } }) }); id = folder.id; }
  const metadata = await privateBackupFile(accessToken, id);
  if (metadata.mimeType !== 'application/vnd.google-apps.folder' || metadata.appProperties?.sm_vault_folder !== appId) throw new Error('Invalid backup folder.');
  return id;
}
export async function uploadVaultBackup(accessToken, metadata, encrypted) {
  const boundary = `vault_${crypto.randomUUID()}`;
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n${encrypted}\r\n--${boundary}--\r\n`;
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Encrypted backup upload failed.');
  await privateBackupFile(accessToken, result.id);
  return result;
}