import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';
import { checkGoogleAuthCredentials } from '../../shared/googleAuthCheck.ts';

// ──────────────────────────────────────────────────────────────
// bootstrapSupabase — uses the authorized Supabase connection to repair auth.
// A legacy admin-supplied PAT is optional. dryRun validates without writing.
// Invalid Google credentials are never pushed into the project.
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
// Connection tokens stay server-side. Google credentials come from app secrets.
// ──────────────────────────────────────────────────────────────

const PUBLISHED_ORIGINS = (process.env.APP_URL || '').split(',').filter(Boolean);

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

-- Preserve an existing signup trigger function, including approved owner roles.
do $bootstrap$
begin
  if to_regprocedure('public.handle_new_user()') is null then
    execute $definition$
      create function public.handle_new_user() returns trigger
      language plpgsql security definer set search_path = public, pg_temp as $function$
      begin
        insert into public.profiles (id, email, full_name, role)
        values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user')
        on conflict (id) do nothing;
        return new;
      end; $function$;
    $definition$;
  end if;
end; $bootstrap$;

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
    if (!PUBLISHED_ORIGINS.length) return Response.json({ code: 'NOT_CONFIGURED', error: 'APP_URL is required.' }, { status: 503 });
    const pat = typeof body.supabaseAccessToken === 'string' ? body.supabaseAccessToken.trim() : '';
    const accessToken = pat || (await base44.asServiceRole.connectors.getConnection('supabase')).accessToken;

    const supabaseUrl = secrets.get('SUPABASE_URL');
    const googleClientId = secrets.get('GOOGLE_OAUTH_CLIENT_ID');
    const googleClientSecret = secrets.get('GOOGLE_OAUTH_CLIENT_SECRET');

    if (!supabaseUrl) return Response.json({ error: 'SUPABASE_URL is not set in app secrets' }, { status: 500 });

    const managementHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
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

    const googleCheck = await checkGoogleAuthCredentials(googleClientId, googleClientSecret, projectRef);
    steps.push({ step: 'Verify Google accepts credentials', status: googleCheck.state === 'ready' ? 'success' : 'failed', detail: googleCheck.detail });
    if (body.dryRun === true) return Response.json({ steps, complete: googleCheck.state === 'ready', google_ready: googleCheck.state === 'ready' });
    if (googleCheck.state !== 'ready') return Response.json({ steps, code: 'NOT_CONFIGURED', error: googleCheck.detail }, { status: 400 });

    // ── Step 2: Push verified Google OAuth credentials + redirect URLs ──
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

    const allSuccess = steps.every((s) => s.status === 'success' || s.status === 'skipped');
    return Response.json({ steps, complete: allSuccess });
  } catch (error) {
    return Response.json({ steps, error: error.message }, { status: 500 });
  }
}