// One persistent Supabase client is shared by auth, database, storage and requests.
import { createClient } from '@supabase/supabase-js';
import { runtimeRequest } from '@/lib/runtimeTransport';
let client;
let initializing;
// A corrupted or truncated session in localStorage makes the Supabase SDK
// throw "Unexpected end of JSON input" during client creation. Clear it
// before the client is created so restoration starts from a clean slate.
function clearCorruptedSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try { JSON.parse(raw); }
      catch { localStorage.removeItem(key); }
    }
  } catch { /* localStorage may be unavailable in some contexts */ }
}

export async function getSupabase() {
  if (client) return client;
  if (!initializing) initializing = (async () => {
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) ({ supabaseUrl, supabaseAnonKey } = await runtimeRequest('/functions/getAuthConfig', {}));
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('NOT_CONFIGURED: Supabase public configuration is missing.');
    clearCorruptedSession();
    client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });
    return client;
  })();
  try { return await initializing; } catch (error) { initializing = null; throw error; }
}
export async function getAccessToken() {
  try {
    const { data } = await (await getSupabase()).auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}