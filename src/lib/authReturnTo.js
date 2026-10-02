// Keep post-login navigation inside this app, including the consent request context.
export function safeReturnTo() {
  const urlParams = new URLSearchParams(window.location.search);
  const value = urlParams.get('returnTo');
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(value)) return '/portal';
  try {
    const destination = new URL(value, window.location.origin);
    if (destination.origin !== window.location.origin || destination.pathname.startsWith('//')) return '/';
    return destination.pathname + destination.search + destination.hash;
  } catch {
    return '/';
  }
}