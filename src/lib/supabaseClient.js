// Browser-side Supabase client — lazy-initialized.
// Replaces the Base44 SDK's server connection for all entity/auth operations.
//
// Config resolution order:
// 1. Vite env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — set in Vercel
// 2. getAuthConfig backend function — transitional fallback while env vars
//    are not yet deployed

import { createClient } from '@supabase/supabase-js';

let _client = null;
let _initPromise = null;

export async function getSupabase() {
  if (_client) return _client;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    let url = import.meta.env.VITE_SUPABASE_URL;
    let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      // Transitional fallback: fetch config from the backend function.
      // Once VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set in Vercel,
      // this path is never hit and the Base44 dependency is gone.
      const res = await fetch('/functions/getAuthConfig');
      if (res.ok) {
        const data = await res.json();
        url = data.supabaseUrl;
        anonKey = data.supabaseAnonKey;
      }
    }
    if (!url || !anonKey) {
      throw new Error('Supabase configuration unavailable. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    _client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return _client;
  })();

  try {
    return await _initPromise;
  } catch (err) {
    _initPromise = null;
    throw err;
  }
}

// Returns the current Supabase session token (for forwarding to Railway).
export async function getAccessToken() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}