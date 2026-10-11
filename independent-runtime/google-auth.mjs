import { createPublicKey, verify } from 'node:crypto';

const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const DEFAULT_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';
const MAX_TOKEN_BYTES = 12000;

function fail(message) { throw new Error(message); }
function parseSegment(value) {
  try { return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')); }
  catch { fail('Malformed Google ID token'); }
}
export function buildGoogleVerifier({ clientId, allowedEmails, fetchJwks, nowSeconds = () => Math.floor(Date.now() / 1000) }) {
  if (typeof clientId !== 'string' || !/^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(clientId)) fail('Valid Google OAuth client ID required');
  const allow = new Set((Array.isArray(allowedEmails) ? allowedEmails : []).map(x => x.toLowerCase().trim()).filter(Boolean));
  if (!allow.size) fail('Configured operator email allowlist required');
  const provider = fetchJwks ?? (async () => {
    const r = await fetch(DEFAULT_JWKS_URI, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) fail('Google JWKS unavailable');
    return r.json();
  });
  let cached = null, cachedAt = 0;
  return async function verifyGoogleIdToken(token) {
    if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_BYTES) fail('Invalid Google token');
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some(p => !p || !/^[A-Za-z0-9_-]+$/.test(p))) fail('Malformed Google ID token');
    const [head64, payload64, sig64] = parts;
    const header = parseSegment(head64);
    if (header.alg !== 'RS256' || header.typ && header.typ !== 'JWT' || typeof header.kid !== 'string') fail('Unsupported signing method');
    const now = nowSeconds();
    if (!cached || now - cachedAt >= 300) {
      cached = await provider();
      cachedAt = now;
    }
    if (!Array.isArray(cached?.keys)) fail('Invalid Google JWKS');
    const jwk = cached.keys.find(k => k.kid === header.kid && k.kty === 'RSA' && (!k.use || k.use === 'sig'));
    if (!jwk) fail('Google signing key not found');
    let valid = false;
    try {
      const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
      valid = verify('RSA-SHA256', Buffer.from(head64 + '.' + payload64), publicKey, Buffer.from(sig64, 'base64url'));
    } catch { fail('Invalid Google signing key'); }
    if (!valid) fail('Google token signature invalid');
    const claims = parseSegment(payload64);
    if (!GOOGLE_ISSUERS.has(claims.iss) || claims.aud !== clientId) fail('Issuer or audience invalid');
    if (!Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now + 60) fail('Google token timestamp invalid');
    if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + 60)) fail('Google token not yet valid');
    if (typeof claims.sub !== 'string' || claims.sub.length < 4 || claims.sub.length > 100) fail('Google subject missing');
    if (claims.email_verified !== true || typeof claims.email !== 'string' || !allow.has(claims.email.toLowerCase())) fail('Operator identity unauthorized');
    return Object.freeze({ issuer: claims.iss, sub: claims.sub, email: claims.email.toLowerCase(), tenantKey: 'google:' + claims.sub });
  };
}
export function configuredGoogleClientId() {
  return process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || '';
}
