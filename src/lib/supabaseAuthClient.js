// Frontend Supabase auth client — replaces Base44 auth.
//
// Lazy-initializes the Supabase client by fetching public config
// (URL + anon key) from the getAuthConfig backend function. The anon
// key is public-safe (embedded in frontend JS, protected by RLS).
//
// Exposes async wrappers: signUp, signIn, signOut, getSession, getUser,
// onAuthStateChange, getAccessToken, signInWithGoogle,
// resetPasswordForEmail, updateUserPassword, getSupabaseAuth.
import { getSupabase } from '@/lib/supabaseClient';
import { safeReturnTo } from '@/lib/authReturnTo';
const initAuth = getSupabase;
export async function getSupabaseAuth() { return getSupabase(); }

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
  // A corrupted or truncated session in localStorage makes the Supabase SDK
  // throw "Unexpected end of JSON input" during initialize/getSession. Detect
  // and clear it so the user lands on a clean login instead of a crash.
  clearCorruptedSession();
  // getSession alone does not report a failed OAuth URL exchange. Await and
  // check initialization so the return handler can display the real error.
  const { error: initializationError } = await supabaseAuth.auth.initialize();
  if (initializationError) throw initializationError;
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return data.session;
}

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

export async function getUser() {
  const supabaseAuth = await initAuth();
  const {
    data: { user }, error,
  } = await supabaseAuth.auth.getUser();
  if (error) {
    // A corrupted local session can surface as a JSON parse error.
    // Treat it as "no user" so the login page renders normally.
    if (/Unexpected end of JSON input|JSON\.parse/i.test(error.message)) return null;
    throw error;
  }
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
  try {
    const { data } = await supabaseAuth.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    // Corrupted session or transient parse error — treat as unauthenticated.
    return null;
  }
}

// OAuth must return to a live app origin, never the embedded builder preview.
// Supabase's Google callback remains on Supabase; these are app return URLs.
const PUBLISHED_APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const OAUTH_APP_ORIGINS = [...new Set([new URL(PUBLISHED_APP_URL).origin, window.location.origin])];

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