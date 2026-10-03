import { secrets } from './runtimeSecrets.ts';
import { Buffer } from 'node:buffer';

async function backupKey() {
  const value = secrets.get('VAULT_BACKUP_ENCRYPTION_KEY');
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw new Error('The protected backup encryption key is unavailable.');
  return await crypto.subtle.importKey('raw', Buffer.from(value, 'hex'), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
function context(appId, ownerId) { return new TextEncoder().encode(`strategic-vault:v1:${appId}:${ownerId}`); }
export async function encryptVault(snapshot, appId, ownerId) {
  const plaintext = new TextEncoder().encode(JSON.stringify(snapshot));
  if (plaintext.byteLength > 8 * 1024 * 1024) throw new Error('Vault exceeds the current 8 MB backup limit.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: context(appId, ownerId) }, await backupKey(), plaintext);
  return JSON.stringify({ version: 1, algorithm: 'AES-256-GCM', iv: Buffer.from(iv).toString('base64'), ciphertext: Buffer.from(ciphertext).toString('base64') });
}
export async function decryptVault(envelope, appId, ownerId) {
  if (envelope.version !== 1 || envelope.algorithm !== 'AES-256-GCM' || typeof envelope.iv !== 'string' || typeof envelope.ciphertext !== 'string') throw new Error('Unsupported encrypted backup.');
  const iv = Buffer.from(envelope.iv, 'base64');
  if (iv.length !== 12) throw new Error('Invalid encrypted backup.');
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: context(appId, ownerId) }, await backupKey(), Buffer.from(envelope.ciphertext, 'base64'));
  const snapshot = JSON.parse(new TextDecoder().decode(plaintext));
  if (snapshot.owner_id !== ownerId || snapshot.app_id !== appId) throw new Error('This backup belongs to another account.');
  return snapshot;
}
export async function vaultRows(entity, query) {
  const rows = []; let skip = 0;
  while (true) {
    const page = await entity.filter(query, 'id', 100, skip);
    rows.push(...page);
    if (page.length < 100) return rows;
    skip += page.length;
  }
}