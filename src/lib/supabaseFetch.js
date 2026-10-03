// Keep response parsing errors separate from saved-session corruption.
export default async function supabaseFetch(input, options) {
  const url = new URL(typeof input === 'string' ? input : input.url || input.href);
  const isAuth = url.pathname.startsWith('/auth/v1/');
  let response;
  try {
    response = await globalThis.fetch(input, options);
  } catch (error) {
    if (!isAuth || error.name === 'AbortError') throw error;
    throw Object.assign(new Error(`The sign-in service could not be reached at ${url.pathname} (HTTP unavailable). Please try again.`), { status: 0, path: url.pathname, code: 'AUTH_NETWORK_ERROR' });
  }
  if (!isAuth) return response;
  const method = (options?.method || input.method || 'GET').toUpperCase();
  // These SDK operations explicitly accept a bodyless success response.
  if (method === 'HEAD' || (response.ok && (method === 'DELETE' || url.pathname.endsWith('/logout')))) return response;
  const fail = detail => Object.assign(new Error(`The sign-in service returned ${detail} at ${url.pathname} (HTTP ${response.status}). Please try again.`), { status: response.status, path: url.pathname, code: 'AUTH_RESPONSE_INVALID' });
  const text = await response.clone().text();
  if (!text.trim()) throw fail('an empty response');
  let data;
  try { data = JSON.parse(text); }
  catch { throw fail('an incomplete or invalid response'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail('an invalid response');
  return response;
}