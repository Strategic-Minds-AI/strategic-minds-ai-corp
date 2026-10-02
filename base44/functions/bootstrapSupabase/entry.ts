import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ──────────────────────────────────────────────────────────────
// bootstrapSupabase — accepts a Supabase Personal Access Token
// (PAT) from the admin and uses it to configure the entire auth
// system end-to-end:
//
//   1. Resolve the project ref from the configured SUPABASE_URL.
//   2. Push Google OAuth credentials (from app secrets) into the
//      Supabase auth config so Google Sign-In stops failing with
//      "Unable to exchange external code".
//   3. Set the correct site_url and uri_allow_list for the app's
//      production and builder-preview origins.
//   4. Create the public.profiles table + auto-create trigger so
//      every new Supabase Auth user gets a role row automatically.
//
// The PAT is provided by the admin in the request body — it is NOT
// stored. Google OAuth credentials come from app secrets.
// ──────────────────────────────────────────────────────────────

const PUBLISHED_ORIGINS = [
  'https://strategic-ai-consulting.base44.app',
  'https://strategicmindai.com',
  'https://strategicmindsai.com',
];

const PROFILES_SQL = `
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
`;

function deriveProjectRef(supabaseUrl: string): string {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    const ref = hostname.split('.')[0];
    if (!ref || ref.length !== 20 || !/^[a-z]+$/.test(ref)) {
      throw new Error(`Unexpected hostname format: ${hostname}`);
    }
    return ref;
  } catch (e) {
    throw new Error(`Cannot derive Supabase project ref from URL "${supabaseUrl}": ${e.message}`);
  }
}

export default async function(req: Request): Promise<Response> {
  const steps: Array<{ step: string; status: string; detail?: string }> = [];

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const pat = (body.supabaseAccessToken || '').trim();
    if (!pat) return Response.json({ error: 'Missing Supabase access token' }, { status: 400 });

    const supabaseUrl = secrets.get('SUPABASE_URL');
    const googleClientId = secrets.get('GOOGLE_OAUTH_CLIENT_ID');
    const googleClientSecret = secrets.get('GOOGLE_OAUTH_CLIENT_SECRET');

    if (!supabaseUrl) return Response.json({ error: 'SUPABASE_URL is not set in app secrets' }, { status: 500 });

    const managementHeaders: Record<string, string> = {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    };

    // ── Step 1: Resolve project ref ──
    let projectRef: string;
    try {
      projectRef = deriveProjectRef(supabaseUrl);
      const verifyRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
        headers: managementHeaders,
      });
      if (!verifyRes.ok) {
        const detail = await verifyRes.text().catch(() => '');
        throw new Error(`Project lookup failed (${verifyRes.status}): ${detail.slice(0, 200)}`);
      }
      steps.push({ step: 'Resolve Supabase project', status: 'success', detail: `ref=${projectRef}` });
    } catch (e) {
      steps.push({ step: 'Resolve Supabase project', status: 'failed', detail: e.message });
      return Response.json({ steps, error: 'Could not resolve the Supabase project' }, { status: 500 });
    }

    // ── Step 2: Push Google OAuth credentials + redirect URLs ──
    try {
      const authConfigBody: Record<string, unknown> = {
        site_url: PUBLISHED_ORIGINS[0],
        uri_allow_list: PUBLISHED_ORIGINS.map((o) => `${o}/**`).join(','),
      };
      if (googleClientId && googleClientSecret) {
        authConfigBody.external_google_enabled = true;
        authConfigBody.external_google_client_id = googleClientId;
        authConfigBody.external_google_secret = googleClientSecret;
      }
      const authRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
        method: 'PATCH',
        headers: managementHeaders,
        body: JSON.stringify(authConfigBody),
      });
      if (!authRes.ok) {
        const detail = await authRes.text().catch(() => '');
        throw new Error(`Auth config update failed (${authRes.status}): ${detail.slice(0, 300)}`);
      }
      steps.push({
        step: 'Configure Google OAuth + redirect URLs',
        status: 'success',
        detail: googleClientId
          ? 'Google client ID + secret pushed, site_url and uri_allow_list set'
          : 'site_url and uri_allow_list set (Google credentials not yet in app secrets)',
      });
    } catch (e) {
      steps.push({ step: 'Configure Google OAuth + redirect URLs', status: 'failed', detail: e.message });
    }

    // ── Step 3: Create profiles table + trigger ──
    try {
      const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: managementHeaders,
        body: JSON.stringify({ query: PROFILES_SQL }),
      });
      if (!sqlRes.ok) {
        const detail = await sqlRes.text().catch(() => '');
        throw new Error(`Database query failed (${sqlRes.status}): ${detail.slice(0, 300)}`);
      }
      steps.push({ step: 'Create profiles table + auto-trigger', status: 'success', detail: 'profiles table and handle_new_user trigger ready' });
    } catch (e) {
      steps.push({ step: 'Create profiles table + auto-trigger', status: 'failed', detail: e.message });
    }

    // ── Step 4: Verify Google credentials are accepted by Google ──
    if (googleClientId && googleClientSecret) {
      try {
        const googleRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleClientId.split(',')[0].trim(),
            client_secret: googleClientSecret,
            redirect_uri: `https://${projectRef}.supabase.co/auth/v1/callback`,
            grant_type: 'authorization_code',
            code: `diagnostic-invalid-code-${crypto.randomUUID()}`,
          }),
        });
        const googleResult = await googleRes.json();
        if (googleRes.status === 400 && googleResult.error === 'invalid_grant') {
          steps.push({ step: 'Verify Google accepts credentials', status: 'success', detail: 'Google recognizes the client ID + secret' });
        } else if (googleRes.status === 401 && googleResult.error === 'invalid_client') {
          steps.push({ step: 'Verify Google accepts credentials', status: 'failed', detail: 'Google rejected the client ID or secret — check they match the Google Cloud Console' });
        } else {
          steps.push({ step: 'Verify Google accepts credentials', status: 'warning', detail: `Unexpected response: ${googleResult.error || googleRes.status}` });
        }
      } catch (e) {
        steps.push({ step: 'Verify Google accepts credentials', status: 'warning', detail: e.message });
      }
    } else {
      steps.push({ step: 'Verify Google accepts credentials', status: 'skipped', detail: 'GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET not set in app secrets' });
    }

    const allSuccess = steps.every((s) => s.status === 'success' || s.status === 'skipped');
    return Response.json({ steps, complete: allSuccess });
  } catch (error) {
    return Response.json({ steps, error: error.message }, { status: 500 });
  }
}