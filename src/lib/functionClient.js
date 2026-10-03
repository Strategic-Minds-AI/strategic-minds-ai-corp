// Every function uses the independent backend, including nested generator calls.
// When the Railway backend isn't configured, fall back to the Base44 platform
// function endpoint so the app works in both environments.
import { getAccessToken } from '@/lib/supabaseClient';
import { runtimeRequest, API_BASE } from '@/lib/runtimeTransport';

const RAILWAY_CONFIGURED = Boolean(import.meta.env.VITE_RAILWAY_API_URL || import.meta.env.VITE_RAILWAY_URL);

export const functions = {
  async invoke(name, data = {}) {
    if (!/^[\w-]+$/.test(name)) throw new Error('Invalid function name');
    const token = name === 'getAuthConfig' ? null : await getAccessToken();
    if (RAILWAY_CONFIGURED) {
      return { data: await runtimeRequest(`/functions/${name}`, data, { token }) };
    }
    // Base44 platform fallback: POST directly to /functions/<name>
    const response = await fetch(`/functions/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(data || {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error) {
      throw Object.assign(new Error(result.error?.message || result.error || `Request failed (${response.status})`), { status: response.status });
    }
    return { data: result };
  },
};