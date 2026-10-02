// Railway auth middleware for the Base44 -> Supabase migration.
// The frontend forwards a Supabase access token in Authorization: Bearer <token>.
// This module validates that token with Supabase and resolves server-controlled
// authorization metadata. It no longer calls Base44 authContext.
import { supabase } from './supabase.js';

const roleCache = new Map(); // userId -> { role, expires }

export async function resolveUser(req) {
  const auth = req.headers?.authorization || req.headers?.get?.('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.slice(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) return null;

    const userId = user.id;
    let role = user.app_metadata?.role || 'user';

    // Optional profile lookup. Authorization never trusts user_metadata.
    const cached = roleCache.get(userId);
    if (cached && cached.expires > Date.now()) {
      role = cached.role;
    } else {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        role = user.app_metadata?.role || profile?.role || 'user';
      } catch {
        role = user.app_metadata?.role || 'user';
      }
      roleCache.set(userId, { role, expires: Date.now() + 60000 });
    }

    return {
      id: userId,
      email: user.email,
      role,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        '',
    };
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
