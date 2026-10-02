import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// Lists app-user profiles from the agency Supabase project.
// Replaces base44.entities.User.list(), which is denied under Supabase auth
// because the Base44 SDK does not recognize the Supabase session as a Base44 admin.
//
// Uses the app's configured SUPABASE_URL + SUPABASE_SERVICE_KEY (the same
// project the frontend auth client uses) rather than the OAuth connector,
// which may point to a different project.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });

    const supabaseUrl = (secrets.get('SUPABASE_URL') || '').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return Response.json({ error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in app secrets.' }, { status: 503 });
    }

    // Query the profiles table via PostgREST (same project as frontend auth).
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,role&role=eq.user&order=created_at.desc`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      // 404 / 42P01 → profiles table missing; guide the admin to run bootstrapSupabase.
      if (res.status === 404 || /relation.*does not exist|Could not find/i.test(body)) {
        return Response.json({ error: 'The profiles table does not exist yet. Run the Supabase Bootstrap Console (dry run first) to create it.' }, { status: 503 });
      }
      return Response.json({ error: `Supabase query failed: ${res.status}` }, { status: 502 });
    }

    const rows: any[] = await res.json();
    const clients = rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      full_name: r.full_name || '',
      role: r.role || 'user',
    }));

    return Response.json({ clients });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not load clients.' }, { status: 500 });
  }
}