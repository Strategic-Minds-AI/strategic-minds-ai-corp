// Replaces base44.auth.* — backed by Supabase Auth.
// The actual session management lives in supabaseAuthClient.js (already in use).
// These wrappers provide the base44.auth API shape for any code that still
// calls it directly.

import { getSupabase, getAccessToken } from './supabaseClient';

export const auth = {
  async me() {
    const supabase = await getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user',
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
    };
  },

  async isAuthenticated() {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  async updateMe(data) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) throw new Error(error.message);
    return this.me();
  },

  async logout(redirectUrl) {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
    else window.location.reload();
  },

  async redirectToLogin(nextUrl) {
    const current = window.location.pathname + window.location.search;
    window.location.href = `/login?returnTo=${encodeURIComponent(nextUrl || current)}`;
  },
};

export const users = {
  async inviteUser(email, role) {
    // Route to Railway endpoint (which uses Supabase admin API)
    const RAILWAY_URL = import.meta.env.VITE_RAILWAY_API_URL;
    if (RAILWAY_URL) {
      const token = await getAccessToken();
      const res = await fetch(`${RAILWAY_URL}/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, role }),
      });
      return res.json();
    }
    throw new Error('User invites require VITE_RAILWAY_API_URL to be configured.');
  },
};

export const analytics = {
  track(event) {
    // No-op — or forward to a custom analytics endpoint
    if (import.meta.env.DEV) console.debug('[analytics]', event);
  },
};