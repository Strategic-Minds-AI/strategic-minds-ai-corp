// All application requests go to the owned backend; there is no platform fallback.
export const API_BASE = (import.meta.env.VITE_RAILWAY_API_URL || import.meta.env.VITE_RAILWAY_URL || '/api/runtime').replace(/\/$/, '');
export async function runtimeRequest(path, payload, { token, method = 'POST', form = false } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...(!form ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(method !== 'GET' ? { body: form ? payload : JSON.stringify(payload || {}) } : {}),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw Object.assign(new Error(data.error?.message || data.error || `Request failed (${response.status})`), { code: data.code, status: response.status });
  return data;
}