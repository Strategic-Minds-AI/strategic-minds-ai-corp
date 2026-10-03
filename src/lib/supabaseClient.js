// One persistent Supabase client is shared by auth, database, storage and requests.
import { createClient } from '@supabase/supabase-js';
import { runtimeRequest } from '@/lib/runtimeTransport';
let client;
let initializing;
export async function getSupabase() {
  if (client) return client;
  if (!initializing) initializing = (async () => {
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) ({ supabaseUrl, supabaseAnonKey } = await runtimeRequest('/functions/getAuthConfig', {}));
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('NOT_CONFIGURED: Supabase public configuration is missing.');
    client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });
    return client;
  })();
  try { return await initializing; } catch (error) { initializing = null; throw error; }
}
export async function getAccessToken() {
  const { data, error } = await (await getSupabase()).auth.getSession();
  if (error) throw error;
  return data.session?.access_token || null;
}