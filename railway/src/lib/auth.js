// Auth bridge for the Railway backend — validates Supabase JWTs directly.
// Replaces the old Base44 auth callback with local Supabase validation.
//
// The frontend forwards its Supabase access token as:
//   Authorization: Bearer <supabase_access_token>
//
// This middleware validates the JWT against Supabase Auth and fetches
// the user's profile (role, full_name) from the profiles table.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Service-role client for profile lookups (bypasses RLS).
const serviceClient = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

// Anon client for JWT validation (uses Supabase's auth.getUser).
const anonClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const cache = new Map(); // token -> { user, expires }

export async function resolveUser(req) {
  if (!anonClient || !serviceClient) return null;

  const authHeader = req.headers?.get?.('authorization') || req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const cached = cache.get(token);
  if (cached && cached.expires > Date.now()) return cached.user;

  try {
    // Validate the JWT by calling getUser with it.
    const { data: authData, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !authData.user) return null;

    // Fetch the profile (role, full_name) using the service key.
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const user = {
      id: authData.user.id,
      email: authData.user.email,
      role: profile?.role || 'user',
      full_name: profile?.full_name || authData.user.user_metadata?.full_name || '',
    };

    cache.set(token, { user, expires: Date.now() + 60000 });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(req, res) {
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return null;
  }
  return user;
}