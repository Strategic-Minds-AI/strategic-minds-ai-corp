export async function hashVaultKey(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function createVaultKey(): string {
  return 'smv_' + Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function keyMetadata(key: any) {
  return { id: key.id, label: key.label, prefix: key.prefix, scope: key.scope, expires_at: key.expires_at, revoked: key.revoked };
}