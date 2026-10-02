// Auth middleware — validates Supabase JWTs directly. No Base44 dependency.
// The frontend sends the Supabase access token as: Authorization: Bearer <token>
// We resolve the user via supabase.auth.getUser(token) and read their role
// from the profiles table.
import { supabase } from './supabase.js';

const roleCache = new Map(); // userId -> { role, expires }

export async function resolveUser(req) {
  const auth = req.headers.authorization || req.headers.get?.('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);

  try {
    // Validate the JWT against Supabase Auth
    const { data: authData, error } = await supabase.auth.getUser(token);
    if (error || !authData?.user) return null;
    const userId = authData.user.id;

    // Resolve role from profiles (cache 60s)
    let role = 'user';
    const cached = roleCache.get(userId);
    if (cached && cached.expires > Date.now()) {
      role = cached.role;
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      role = profile?.role || 'user';
      roleCache.set(userId, { role, expires: Date.now() + 60000 });
    }

    return { id: userId, email: authData.user.email, role, full_name: authData.user.user_metadata?.full_name || '' };
  } catch {
    return null;
  }
}

export async function requireUser(req, res) {
  const user = await resolveUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await resolveUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  if (user.role !== 'admin') { res.status(403).json({ error: 'Admin only' }); return null; }
  return user;
}