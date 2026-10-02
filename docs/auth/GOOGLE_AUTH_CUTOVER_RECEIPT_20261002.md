# Google Auth Cutover Receipt — 2026-10-02

Status: PREVIEW_BUILD_PASS / AUTH_FLOW_NOT_YET_PROVEN

## Source

- Repository: Strategic-Minds-AI/strategic-minds-ai-corp
- Branch: apex/google-auth-cutover-20261002-v2
- Branch base: 7911b96648abc3ea5d7ca7ed27ca269490be658a
- Final branch SHA at build validation: aa6d0fff52888f079e4325bf7ec0bd485276ca52

## Verified Google / Supabase state

- Google provider was enabled by the operator in Supabase project `jadlpbokfdkonvnfxjzs`.
- Supabase URL: `https://jadlpbokfdkonvnfxjzs.supabase.co`.
- A browser-safe Supabase publishable key exists.
- Auth user count was 0 before first cutover validation.

## Drift discovered on main

Commit `7911b96648abc3ea5d7ca7ed27ca269490be658a` claimed to migrate authentication to Supabase and remove Base44 dependency, but independent inspection found:

- `src/lib/AuthContext.jsx` still used Base44 auth.
- `src/pages/Login.jsx` still used Base44 Google login.
- `src/pages/Register.jsx` still used Base44 Google login.
- `railway/src/lib/auth.js` still validated Base44 tokens.
- A duplicate Supabase auth middleware existed under a non-runtime path.
- `supabase/schema.sql` still described Base44 as auth authority.

Therefore the main-branch implementation is not accepted as an auth-cutover PASS.

## Branch repairs

1. `src/lib/supabaseAuthClient.js`
   - safe no-config behavior
   - support for modern publishable key or legacy anon key
   - Google `signInWithOAuth`
   - safe same-origin return path
   - Supabase session/user helpers
   - server-controlled role preference via `app_metadata`
   - no authorization decisions based on `user_metadata`

2. `src/lib/AuthContext.jsx`
   - prefer a valid Supabase session when present
   - retain Base44 as migration rollback
   - expose active auth provider
   - Supabase logout path
   - no Base44 public-settings dependency for an established Supabase session

3. `src/pages/Login.jsx`
   - Google login uses Supabase when configured
   - Base44 Google remains fallback when Supabase environment configuration is absent

4. `src/pages/Register.jsx`
   - same Google migration behavior as Login
   - Base44 email/OTP remains unchanged during this bounded slice

5. `railway/src/lib/auth.js`
   - remove Base44 authContext bridge
   - validate Supabase access token via `supabase.auth.getUser(token)`
   - prefer `app_metadata.role` for authorization
   - optional profiles lookup only as server-side enrichment

6. `railway/src/lib/supabase.js`
   - stale Base44 auth comment removed
   - service-role use documented as trusted-server-only

## Independent build evidence

Vercel preview deployment:

- Deployment ID: `dpl_2QaonamZJYPQQQ7tus3TQd4LkGJQ`
- Source branch: `apex/google-auth-cutover-20261002-v2`
- Source SHA: `aa6d0fff52888f079e4325bf7ec0bd485276ca52`
- State: READY
- Target: preview / non-production
- GitHub combined status: Vercel SUCCESS

This proves the branch builds. It does not prove OAuth login, role authorization, Google token refresh, or Railway auth behavior.

## Remaining configuration gates

### Supabase Auth URL configuration
Must permit the intended application return URLs. At minimum configure the canonical production Site URL and a controlled preview redirect pattern or exact preview URL during validation.

### Vercel preview variables
The preview build must receive:
- `VITE_SUPABASE_URL=https://jadlpbokfdkonvnfxjzs.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<browser-safe publishable key>`

Do not use a Supabase service-role/secret key in any `VITE_*` variable.

### First-user authorization
Google sign-in will create the first Supabase Auth user. Admin authorization must be bound using server-controlled metadata or a protected profiles/roles path. Do not authorize admin access based only on email text in frontend code or `user_metadata`.

### Railway
The actual Railway backend requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Those environment mutations and deployment remain protected. The backend should not be called independently until the preview user token can be validated and role denial/allow behavior is tested.

## PASS criteria before production

- Google redirect begins from the Strategic Minds app, not Base44
- callback succeeds through Supabase
- browser receives/persists Supabase session
- reload preserves session
- logout removes session
- invalid/expired token returns 401
- non-admin user is denied admin operations
- approved admin receives admin access through server-controlled authorization
- Railway validates Supabase JWT
- Base44 fallback remains available until production approval
- no service-role or Google client secret is present in browser bundle/logs/source
- preview E2E PASS
- rollback path documented and tested

## Protected actions not executed

- no Vercel environment-variable mutation
- no Supabase role/admin mutation
- no Supabase schema/RLS mutation
- no Railway secret/environment mutation
- no Railway deployment
- no GitHub merge/default-branch mutation
- no production deployment
- no Google credential rotation/revocation
