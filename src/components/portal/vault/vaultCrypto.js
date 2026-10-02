const encoder = new TextEncoder();
const encode = bytes => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
export function newSalt() { return encode(crypto.getRandomValues(new Uint8Array(16))); }
export async function deriveVaultKey(password, salt) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: decode(salt), iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptVaultValue(key, value, context) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const result = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(context) }, key, encoder.encode(JSON.stringify(value)));
  return { version: 1, iv: encode(iv), ciphertext: encode(new Uint8Array(result)) };
}
export async function decryptVaultValue(key, payload, context) {
  if (payload?.version !== 1) throw new Error('Unsupported encrypted vault format.');
  const result = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(payload.iv), additionalData: encoder.encode(context) }, key, decode(payload.ciphertext));
  return JSON.parse(new TextDecoder().decode(result));
}
export function generateVaultPassword() {
  const pools = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%*-_=+'];
  const index = size => { let byte; const limit = Math.floor(256 / size) * size; do { byte = crypto.getRandomValues(new Uint8Array(1))[0]; } while (byte >= limit); return byte % size; };
  const chars = pools.map(pool => pool[index(pool.length)]), all = pools.join('');
  while (chars.length < 24) chars.push(all[index(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = index(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}