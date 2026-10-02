// Frontend Supabase auth client used during the Base44 -> Supabase migration.
// The browser must use a publishable/anon key only. Never place service-role
// credentials in VITE_* variables.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseAuthConfigured = Boolean(url && publishableKey);

export const supabaseAuth = isSupabaseAuthConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function requireClient() {
  if (!supabaseAuth) {
    throw new Error('Supabase auth is not configured for this environment.');
  }
  return supabaseAuth;
}

function safeReturnPath(returnTo = '/') {
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/';
  }
  return returnTo;
}

export async function signInWithGoogle(returnTo = '/') {
  const client = requireClient();
  const redirectTo = new URL(safeReturnPath(returnTo), window.location.origin).toString();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, fullName) {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || '' } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabaseAuth) return;
  const { error } = await supabaseAuth.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!supabaseAuth) return null;
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  if (!supabaseAuth) return null;
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();
  if (error || !user) return null;

  // Authorization must never trust user_metadata. Prefer app_metadata, which is
  // server controlled. A profiles row may enrich display data but is not
  // required for Google sign-in to work.
  let profile = null;
  try {
    const { data } = await supabaseAuth
      .from('profiles')
      .select('role,full_name')
      .eq('id', user.id)
      .maybeSingle();
    profile = data || null;
  } catch {
    profile = null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.app_metadata?.role || profile?.role || 'user',
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      '',
  };
}

export function onAuthStateChange(callback) {
  if (!supabaseAuth) {
    return { data: { subscription: { unsubscribe() {} } } };
  }
  return supabaseAuth.auth.onAuthStateChange(callback);
}

export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token || null;
}
