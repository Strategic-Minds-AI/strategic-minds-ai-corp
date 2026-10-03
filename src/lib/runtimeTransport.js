// Independent builds use the owned server; hosted functions use SDK routing.
import hostedFunctionRequest from '@/lib/hostedFunctionRequest';
export const USE_OWNED_RUNTIME = import.meta.env.VITE_STANDALONE === 'true' || Boolean(import.meta.env.VITE_RAILWAY_API_URL || import.meta.env.VITE_RAILWAY_URL);
export const API_BASE = (import.meta.env.VITE_RAILWAY_API_URL || import.meta.env.VITE_RAILWAY_URL || '/api/runtime').replace(/\/$/, '');
export async function runtimeRequest(path, payload, { token, method = 'POST', form = false } = {}) {
  const functionName = /^\/functions\/([\w-]+)$/.exec(path)?.[1];
  if (!USE_OWNED_RUNTIME && functionName) return hostedFunctionRequest(functionName, payload, token);
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