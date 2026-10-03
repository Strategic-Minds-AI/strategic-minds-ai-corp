import { secrets } from '../../shared/runtimeSecrets.ts';

// ──────────────────────────────────────────────────────────────
// getAuthConfig — returns the public Supabase config (URL + anon
// key) to the frontend so the Supabase auth client can initialize.
//
// The anon key is public-safe by design (embedded in frontend JS,
// protected by Supabase RLS). No auth required on this endpoint.
// ──────────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const supabaseUrl = secrets.get('SUPABASE_URL');
    const supabaseAnonKey = secrets.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    return Response.json({ supabaseUrl, supabaseAnonKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}