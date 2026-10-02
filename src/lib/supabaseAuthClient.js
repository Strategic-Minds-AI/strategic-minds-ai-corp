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
import { safeReturnTo } from '@/lib/authReturnTo';

let _client = null;
let _initPromise = null;

async function initAuth() {
  if (_client) return _client;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // Try Vite env vars first (for local dev / future platform support)
    let url = import.meta.env.VITE_SUPABASE_URL;
    let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Fall back to the public config endpoint; initialization failures must
    // reach the sign-in screen instead of silently discarding the session.
    if (!url || !anonKey) {
      const res = await base44.functions.invoke('getAuthConfig', {});
      url = res.data?.supabaseUrl;
      anonKey = res.data?.supabaseAnonKey;
    }
    if (!url || !anonKey) throw new Error('Sign-in configuration is unavailable. Please try again.');

    _client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
    });
    return _client;
  })();

  try {
    return await _initPromise;
  } catch (error) {
    _initPromise = null;
    throw error;
  }
}

export async function getSupabaseAuth() {
  return initAuth();
}

export async function signUp(email, password, fullName) {
  const supabaseAuth = await initAuth();
  const { data, error } = await supabaseAuth.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName || '' }, emailRedirectTo: resolveOAuthRedirect() },
  });
  if (error) throw error;
  // The protected database trigger creates profiles and assigns approved roles.
  // Signup must not overwrite an owner's role or grant client-controlled roles.
  return data;
}

export async function signIn(email, password) {
  const supabaseAuth = await initAuth();
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabaseAuth = await initAuth();
  await supabaseAuth.auth.signOut();
}

export async function getSession() {
  const supabaseAuth = await initAuth();
  // getSession alone does not report a failed OAuth URL exchange. Await and
  // check initialization so the return handler can display the real error.
  const { error: initializationError } = await supabaseAuth.auth.initialize();
  if (initializationError) throw initializationError;
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const supabaseAuth = await initAuth();
  const {
    data: { user }, error,
  } = await supabaseAuth.auth.getUser();
  if (error) throw error;
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

// OAuth must return to a live app origin, never the embedded builder preview.
// Supabase's Google callback remains on Supabase; these are app return URLs.
const PUBLISHED_APP_URL = 'https://strategic-ai-consulting.base44.app';
const OAUTH_APP_ORIGINS = [PUBLISHED_APP_URL, 'https://strategicmindai.com', 'https://strategicmindsai.com'];

function resolveOAuthRedirect(redirectTo) {
  let origin = OAUTH_APP_ORIGINS.includes(window.location.origin) ? window.location.origin : PUBLISHED_APP_URL;
  let returnTo = safeReturnTo();
  if (redirectTo) {
    try {
      const destination = new URL(redirectTo, origin);
      if (OAUTH_APP_ORIGINS.includes(destination.origin)) {
        origin = destination.origin;
        returnTo = destination.pathname + destination.search + destination.hash;
      }
    } catch { /* use the safe post-login destination */ }
  }
  // A public return handler completes session restoration before entering
  // protected routes, and retains Google errors instead of losing the hash.
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('returnTo', returnTo);
  return callback.href;
}

export async function signInWithGoogle(redirectTo) {
  const supabaseAuth = await initAuth();
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: resolveOAuthRedirect(redirectTo),
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  return { data };
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