import { secrets } from 'base44:runtime';
import { Buffer } from 'node:buffer';
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function digest(value) {
  return Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)))).toString('hex');
}
async function signingKey() {
  const master = secrets.get('VAULT_BACKUP_ENCRYPTION_KEY');
  const appId = secrets.get('BASE44_APP_ID');
  if (!appId || !master || !/^[a-f0-9]{64}$/i.test(master)) throw new Error('Protected evidence signing is unavailable.');
  const material = await crypto.subtle.importKey('raw', Buffer.from(master, 'hex'), 'HKDF', false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode(`strategic-benchmark:${appId}`), info: new TextEncoder().encode('evidence-signing:v1') }, material, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign', 'verify']);
}
export function proofPayload(record) {
  return { owner_id: record.owner_id, revision: record.revision, run_nonce: record.run_nonce, observed_at: record.observed_at, observations: record.observations };
}
export async function signProof(record) {
  return Buffer.from(await crypto.subtle.sign('HMAC', await signingKey(), new TextEncoder().encode(canonical(proofPayload(record))))).toString('hex');
}
export async function verifyProof(record) {
  if (!record || typeof record.signature !== 'string' || !/^[a-f0-9]{64}$/.test(record.signature)) return false;
  return await crypto.subtle.verify('HMAC', await signingKey(), Buffer.from(record.signature, 'hex'), new TextEncoder().encode(canonical(proofPayload(record))));
}