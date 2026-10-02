// Shared Supabase JWT validator for backend functions.
// Replaces base44.auth.me() after the auth migration to Supabase.
//
// Reads the Supabase access token from the Authorization header, validates it
// against Supabase Auth, and fetches the user's profile row to get their role.
// Returns null if the token is missing, invalid, or the profiles table is not
// configured.

export interface SupabaseUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

export async function getSupabaseUser(req: Request): Promise<SupabaseUser | null> {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  // Validate the JWT via Supabase Auth
  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  });
  if (!authRes.ok) return null;
  const authUser: any = await authRes.json();
  if (!authUser?.id) return null;

  // Fetch the profile row to get the role
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(authUser.id)}&select=id,email,full_name,role&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  if (!profileRes.ok) return null;
  const profiles: any[] = await profileRes.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email || authUser.email || '',
    role: profile.role || 'user',
    full_name: profile.full_name || '',
  };
}