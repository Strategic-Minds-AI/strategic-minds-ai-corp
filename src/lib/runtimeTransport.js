// Every request uses the owner's backend. There is no platform fallback.
// Independent full-stack deployments expose the runtime under /api/runtime.
export const API_BASE = (import.meta.env.VITE_RUNTIME_API_URL || import.meta.env.VITE_RAILWAY_API_URL || import.meta.env.VITE_RAILWAY_URL || (import.meta.env.VITE_STANDALONE === 'true' ? '/api/runtime' : 'https://strategic-minds-ai-corp.vercel.app/api/runtime')).replace(/\/$/, '');
export async function runtimeRequest(path, payload, { token, method = 'POST', form = false } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...(!form ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(method !== 'GET' ? { body: form ? payload : JSON.stringify(payload || {}) } : {}),
  });
  const text = await response.text();
  const fail = message => Object.assign(new Error(message), { status: response.status, path });
  if (!text.trim()) throw fail(`The server returned an empty response for ${path} (HTTP ${response.status}).`);
  let data;
  try { data = JSON.parse(text); }
  catch { throw fail(`The server returned a non-JSON response for ${path} (HTTP ${response.status}). Check the backend address and deployment.`); }
  if (!response.ok || data?.error) throw Object.assign(fail(data?.error?.message || (typeof data?.error === 'string' ? data.error : `Request failed (${response.status})`)), { code: data?.code });
  return data;
}