// Frontend Supabase auth client — replaces Base44 auth.
// Uses the Supabase anon key (public-safe). Set VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY in your frontend env.
//
// Exposes: signUp, signIn, signOut, getSession, onAuthStateChange, getUser
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — auth will not work');
}

export const supabaseAuth = createClient(url || '', anonKey || '', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function signUp(email, password, fullName) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email, password,
    options: { data: { full_name: fullName || '' } },
  });
  if (error) throw error;
  // Create a profile row with default role 'user'
  if (data.user) {
    await supabaseAuth.from('profiles').upsert({ id: data.user.id, email, full_name: fullName || '', role: 'user' });
  }
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabaseAuth.auth.signOut();
}

export async function getSession() {
  const { data } = await supabaseAuth.auth.getSession();
  return data.session;
}

export async function getUser() {
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAuth.from('profiles').select('*').eq('id', user.id).single();
  return { id: user.id, email: user.email, role: profile?.role || 'user', full_name: profile?.full_name || user.user_metadata?.full_name || '' };
}

export function onAuthStateChange(callback) {
  return supabaseAuth.auth.onAuthStateChange(callback);
}

export function getAccessToken() {
  return supabaseAuth.auth.getSession().then(({ data }) => data.session?.access_token || null);
}