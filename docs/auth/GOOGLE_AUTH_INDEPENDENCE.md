# Google Auth Independence — Base44 Exit Plan

Status: DRAFT / BRANCH-SAFE
Branch: apex/google-auth-independence-20261002
Base SHA: 0f3096736098196ba99762e07dd5a2415c56684e

## Objective

Remove Base44 as the authentication authority for Strategic Minds AI without breaking the existing application during migration.

This work deliberately separates two concerns:

1. **Application identity** — who the user is and how the app session is established.
2. **Google API authorization** — which Google services the user or system has granted access to.

The target is Supabase Auth for application identity plus a Strategic Minds-owned Google OAuth broker for Google APIs. Base44 remains a temporary compatibility adapter until backend auth checks and connectors are migrated.

## Verified Current State

- Frontend login and registration use `base44.auth.*`.
- Google sign-in uses `base44.auth.loginWithProvider("google")`.
- `AuthContext.jsx` derives the user/session from Base44.
- Many backend functions authorize with `createClientFromRequest(...)` + `base44.auth.me()`.
- Google Workspace connectors use Base44 connector slots/tokens.
- X1 Supabase staging `uvdkzsbjackpjvpoxtyk` currently has 0 Auth users.
- X1 Supabase production `vgsmyhqqtkkluhypxyua` currently has 0 Auth users.
- Strategic Intelligence and UPI Supabase projects also currently have 0 Auth users.
- Therefore no existing Supabase customer identity migration is required.

## Target Architecture

### Plane A — Identity

```
Browser
  -> Supabase Auth
     -> Google OAuth (openid + email + profile only)
     -> Supabase session/JWT
  -> application AuthContext
  -> Vercel/Supabase APIs validate Supabase JWT
```

### Plane B — Google Workspace/API Access

```
User/Admin chooses "Connect Google"
  -> Strategic Minds Google OAuth web-server flow
  -> incremental least-privilege scopes
  -> access token + refresh token
  -> refresh token persisted only in protected server-side secret storage
  -> backend token broker refreshes access tokens
  -> Gmail / Drive / Calendar / Docs / Sheets / Search Console / Analytics
```

Do not combine broad Google API scopes into normal application sign-in.

## Google Cloud Project Strategy

Use separate Google Cloud projects/clients for staging and production.

Recommended first project:
- Name: `Strategic Minds AI Auth - Staging`
- Owner: Strategic Minds Google Workspace organization
- Audience: **Internal** while only company users are required
- Login scopes only:
  - `openid`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
- OAuth client type: Web application
- Supabase callback:
  - `https://uvdkzsbjackpjvpoxtyk.supabase.co/auth/v1/callback`

Production later:
- `Strategic Minds AI Auth - Production`
- callback:
  - `https://vgsmyhqqtkkluhypxyua.supabase.co/auth/v1/callback`

Customer/public Google sign-in should use a separately governed External OAuth app/client once needed. Do not make the internal operations client the public/customer authorization surface.

## Google API Broker Strategy

Create a separate Google OAuth client for Workspace/API access.

Requirements:
- server-side authorization-code flow
- `access_type=offline`
- CSRF/state validation
- PKCE where applicable
- incremental authorization
- least-privilege scopes
- explicit disconnect/revoke
- encrypted refresh-token storage
- no provider token in browser localStorage for operational use
- no Google client secret in source control

Supabase Auth provider tokens are not the durable Google integration layer. Supabase does not refresh third-party provider tokens on behalf of the application, so operational Google tokens must be handled server-side.

## Preferred Google Access Strategy by Product

### Login / human identity
Supabase Auth + Google provider.

### Shared Drive / internal documents
Prefer a dedicated service identity or narrowly-scoped server-side user grant where operationally appropriate. Do not force every interactive login to carry Drive scopes.

### Gmail / Calendar / Contacts
Use user OAuth first. Domain-wide delegation is a separate privileged architecture decision and requires explicit administrator approval.

### Search Console / Analytics
Prefer service identities/property-level grants when supported and practical, or narrowly-scoped user OAuth. Keep these separate from login.

## Migration Sequence

1. Create/verify Google Cloud staging OAuth project and basic login client.
2. Configure Google provider in X1 Supabase staging.
3. Add Supabase client/session abstraction to the app on this branch.
4. Implement Supabase Google login behind a migration feature flag.
5. Build new backend auth middleware that validates Supabase JWTs.
6. Migrate one low-risk backend endpoint away from `base44.auth.me()`.
7. Validate admin/session/role mapping.
8. Add Google API broker using a separate OAuth client.
9. Migrate one Google connector at a time.
10. Run auth, refresh, logout, revoke, role and API integration tests.
11. Create production OAuth project/client.
12. Configure X1 Supabase production.
13. Preview validation.
14. Operator approval.
15. Production cutover.
16. Remove Base44 auth/connectors only after parity is proven.

## Compatibility Rule

Until cutover, Base44 remains the default production provider.

Do not remove Base44 auth, SDK dependencies, connector slots or backend guards merely because the new Supabase path exists.

Cutover requires independently validated parity and rollback.

## Protected Steps

Require explicit operator approval/current manual completion:
- create Google Cloud OAuth clients/service accounts
- create or rotate client secrets
- configure Supabase provider secrets
- configure domain-wide delegation
- change production redirect URIs
- change production environment variables
- production auth cutover
- revoke Base44/Google credentials

## Validation Contract

Minimum PASS before production:
- Google sign-in
- email/password path if retained
- session refresh
- browser reload persistence
- logout
- expired session handling
- admin authorization
- non-admin denial
- redirect allow-list safety
- OAuth state/CSRF validation
- provider token never exposed in logs
- Google refresh-token rotation path
- revoked grant handling
- Vercel preview
- independent E2E
- rollback to Base44 path

## Immediate Operator Step

Create the **staging** Google OAuth client first. Do not paste the client secret into ChatGPT or source control.

After it is entered directly into Supabase staging, the next branch-safe implementation step is the Supabase Auth adapter and preview validation.
