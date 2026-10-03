import { trustedUser } from './context.mjs';
import { notConfigured } from './runtime.mjs';
export async function getSupabaseUser(request) {
  if (trustedUser(request)) return trustedUser(request);
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw notConfigured('Supabase');
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  if (!response.ok) return null;
  const user = await response.json();
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!profileResponse.ok) throw new Error('Could not load the authenticated profile');
  const [profile] = await profileResponse.json();
  return { ...profile, id: user.id, email: user.email, full_name: profile?.full_name || user.user_metadata?.full_name || '', role: profile?.role || 'user' };
}
export async function requireUser(request, admin = false) {
  const user = await getSupabaseUser(request);
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if (admin && user.role !== 'admin') throw Object.assign(new Error('Admin access required'), { status: 403 });
  return user;
}