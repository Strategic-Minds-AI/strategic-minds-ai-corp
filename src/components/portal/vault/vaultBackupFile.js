import { exportVaultEntries, restoreVaultEntries } from '@/components/portal/vault/secureVaultStore';
export async function downloadVaultBackup(vault) {
  const entries = await exportVaultEntries(vault.owner);
  const snapshot = { format: 'strategic-minds-encrypted-vault', version: 1, exported_at: new Date().toISOString(), settings: vault.settings, entries };
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `encrypted-vault-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function restoreVaultBackup(vault, file) {
  if (!file || file.size > 10 * 1024 * 1024) throw new Error('Choose an encrypted vault backup smaller than 10 MB.');
  let snapshot; try { snapshot = JSON.parse(await file.text()); } catch { throw new Error('That file is not a readable vault backup.'); }
  if (snapshot.format !== 'strategic-minds-encrypted-vault' || snapshot.version !== 1 || !Array.isArray(snapshot.entries) || snapshot.settings?.owner_id !== vault.owner || snapshot.settings.salt !== vault.settings.salt) throw new Error('Use a backup from this administrator account and this vault.');
  if (!window.confirm('Restore this encrypted backup? Matching saved items will be replaced by the backup versions.')) return false;
  const records = [];
  for (const item of snapshot.entries) {
    if (!/^[0-9a-f-]{36}$/i.test(item.id) || item.owner_id !== vault.owner || typeof item.title !== 'string' || !item.title.trim() || item.title.length > 150 || typeof item.provider !== 'string' || item.provider.length > 100 || !['login', 'api_key', 'note'].includes(item.category)) throw new Error('The backup contains an invalid vault item. Nothing has been restored.');
    const plaintext = await vault.verify(item.payload, `${vault.owner}:${item.id}`);
    if (!['username', 'secret', 'url', 'notes'].every(field => typeof plaintext[field] === 'string')) throw new Error('The backup contains invalid encrypted content.');
    records.push({ id: item.id, owner_id: vault.owner, title: item.title, provider: item.provider, category: item.category, payload: item.payload, updated_at: new Date().toISOString() });
  }
  for (let offset = 0; offset < records.length; offset += 200) await restoreVaultEntries(records.slice(offset, offset + 200));
  return true;
}