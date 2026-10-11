export function consentProtocol(query = '') {
  return new URLSearchParams(query).has('authorization_id') ? 'supabase' : 'legacy';
}
export function validAuthorizationId(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 1024 && /^[A-Za-z0-9._-]+$/.test(value);
}
export function consentLoginPath(id) {
  if (!validAuthorizationId(id)) return null;
  return '/login?returnTo=' + encodeURIComponent('/oauth/consent?authorization_id=' + encodeURIComponent(id));
}
export function requestedScopes(scope) {
  return typeof scope === 'string' ? [...new Set(scope.split(/\s+/).filter(Boolean).slice(0, 32))] : [];
}
export function approvedOAuthRedirect(destination, currentOrigin) {
  if (typeof destination !== 'string' || destination.length > 4096) return null;
  try {
    const url = new URL(destination);
    const site = new URL(currentOrigin);
    if (url.username || url.password) return null;
    if (url.protocol === 'https:') return url.href;
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
        && ['localhost', '127.0.0.1'].includes(site.hostname)) return url.href;
  } catch {}
  return null;
}
