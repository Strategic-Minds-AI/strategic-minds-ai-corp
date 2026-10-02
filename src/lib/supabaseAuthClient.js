// Frontend Supabase auth client — replaces Base44 auth.
//
// Lazy-initializes the Supabase client by fetching public config
// (URL + anon key) from the getAuthConfig backend function. The anon
// key is public-safe (embedded in frontend JS, protected by RLS).
//
// Exposes async wrappers: signUp, signIn, signOut, getSession, getUser,
// onAuthStateChange, getAccessToken, signInWithGoogle,
// resetPasswordForEmail, updateUserPassword, getSupabaseAuth.
import { createClient } from '@supabase/supabase-js';
import { base44 } from '@/api/base44Client';

let _client = null;
let _initPromise = null;

async function initAuth() {
  if (_client) return _client;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // Try Vite env vars first (for local dev / future platform support)
    let url = import.meta.env.VITE_SUPABASE_URL;
    let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Fall back to backend config endpoint
    if (!url || !anonKey) {
      try {
        const res = await base44.functions.invoke('getAuthConfig', {});
        url = res.data?.supabaseUrl;
        anonKey = res.data?.supabaseAnonKey;
      } catch (e) {
        console.warn('Failed to fetch Supabase auth config:', e.message);
      }
    }

    if (!url || !anonKey) {
      console.warn('Supabase URL / anon key not available — auth will not work');
    }

    _client = createClient(url || '', anonKey || '', {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return _client;
  })();

  return _initPromise;
}

export async function getSupabaseAuth() {
  return initAuth();
}

export async function signUp(email, password, fullName) {
  const supabaseAuth = await initAuth();
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || '' } },
  });
  if (error) throw error;
  if (data.user) {
    await supabaseAuth
      .from('profiles')
      .upsert({ id: data.user.id, email, full_name: fullName || '', role: 'user' });
  }
  return data;
}

export async function signIn(email, password) {
  const supabaseAuth = await initAuth();
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabaseAuth = await initAuth();
  await supabaseAuth.auth.signOut();
}

export async function getSession() {
  const supabaseAuth = await initAuth();
  const { data } = await supabaseAuth.auth.getSession();
  return data.session;
}

export async function getUser() {
  const supabaseAuth = await initAuth();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAuth
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return {
    id: user.id,
    email: user.email,
    role: profile?.role || 'user',
    full_name: profile?.full_name || user.user_metadata?.full_name || '',
  };
}

export async function onAuthStateChange(callback) {
  const supabaseAuth = await initAuth();
  return supabaseAuth.auth.onAuthStateChange(callback);
}

export async function getAccessToken() {
  const supabaseAuth = await initAuth();
  const { data } = await supabaseAuth.auth.getSession();
  return data.session?.access_token || null;
}

export async function signInWithGoogle(redirectTo) {
  const supabaseAuth = await initAuth();
  return supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo || window.location.origin },
  });
}

export async function resetPasswordForEmail(email, redirectTo) {
  const supabaseAuth = await initAuth();
  return supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || window.location.origin + '/reset-password',
  });
}

export async function updateUserPassword(password) {
  const supabaseAuth = await initAuth();
  return supabaseAuth.auth.updateUser({ password });
}