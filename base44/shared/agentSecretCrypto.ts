// Server-side AES-256-GCM encryption for agent-accessible secrets.
// Reuses the VAULT_BACKUP_ENCRYPTION_KEY master key (already set in env).
import { secrets } from './runtimeSecrets.ts';
import { Buffer } from 'node:buffer';

async function masterKey() {
  const value = secrets.get('VAULT_BACKUP_ENCRYPTION_KEY');
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error('The server encryption key is not configured. Set VAULT_BACKUP_ENCRYPTION_KEY in backend secrets.');
  }
  return crypto.subtle.importKey('raw', Buffer.from(value, 'hex'), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function aad(appId: string) {
  return new TextEncoder().encode(`strategic-agent-secret:v1:${appId}`);
}

export async function encryptSecret(plaintext: string, appId: string): Promise<string> {
  const key = await masterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad(appId) },
    key,
    new TextEncoder().encode(plaintext)
  );
  return JSON.stringify({
    version: 1,
    algorithm: 'AES-256-GCM',
    iv: Buffer.from(iv).toString('base64'),
    ciphertext: Buffer.from(ciphertext).toString('base64'),
  });
}

export async function decryptSecret(envelope: string, appId: string): Promise<string> {
  const parsed = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
  if (parsed.version !== 1 || parsed.algorithm !== 'AES-256-GCM') {
    throw new Error('Unsupported secret envelope.');
  }
  const key = await masterKey();
  const iv = Buffer.from(parsed.iv, 'base64');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad(appId) },
    key,
    Buffer.from(parsed.ciphertext, 'base64')
  );
  return new TextDecoder().decode(plaintext);
}