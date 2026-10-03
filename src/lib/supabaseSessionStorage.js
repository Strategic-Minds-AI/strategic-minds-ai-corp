// Validate only this project's saved session before the SDK initializes.
// Decoding checks format only; Supabase still verifies identity and permissions.
function hasValidToken(token) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return false;
  const decode = part => {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };
  const header = decode(parts[0]);
  const payload = decode(parts[1]);
  return header && typeof header === 'object' && !Array.isArray(header) &&
    payload && typeof payload === 'object' && !Array.isArray(payload) &&
    typeof payload.sub === 'string' && payload.sub.length > 0 && Number.isFinite(payload.exp);
}

export function clearInvalidSupabaseSession(storageKey, storage) {
  let source;
  let raw;
  try {
    source = storage || globalThis.localStorage;
    raw = source.getItem(storageKey);
  } catch { return false; }
  if (raw === null) return false;
  try {
    const session = JSON.parse(raw);
    if (session === null) return false;
    if (hasValidToken(session?.access_token) &&
        typeof session.refresh_token === 'string' && session.refresh_token.length > 0 &&
        Number.isFinite(session.expires_at) && session.expires_at > 0) return false;
  } catch { /* Truncated JSON or an invalid JWT needs a fresh sign-in. */ }
  try {
    source.removeItem(storageKey);
    source.removeItem(`${storageKey}-user`);
    return true;
  } catch { return false; }
}