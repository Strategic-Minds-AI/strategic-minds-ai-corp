# Strategic Minds AI V2 | Independent Command Gateway

**PHASE:** Base44 exit / independent control-plane bootstrap (preview-only). This `independent-runtime/` module imports no Base44 SDK or backend functions; all runtime operations will be hosted on GitHub/Vercel/Supabase/Railway with Apex/Agent Zero as mission commander.

## What's implemented
- Node HTTP gateway with `GET /health` and authenticated planning-only `POST /v1/mission/plan`.
- Google ID token RS256 signature verified against *Google-hosted JWKS*, pinned Google issuer, exact OAuth client ID, expiry, verified allowlisted operator email and server-derived actor identity.
- No client-reported `approved` status, production or spend override. Returns deterministic mission receipt with source hash, no instruction plaintext.
- **No X1 queue writes, production deploy, autonomous build, token exchange, client messaging or privileged MCP tool routes.** Those need the next independently validated canary.
- 19 unit/integration tests (positive and negative) implemented using ephemeral RSA fixture keys. Google JWKS network verification in staging remains to be tested.

## Google OAuth
Non-secret **Google OAuth client ID supplied by operator**: `204537989581-iv4b7lk2637oaadkucadrpr0gonbgjto.apps.googleusercontent.com`.
- Set `GOOGLE_OAUTH_CLIENT_ID` on an isolated Railway staging service. The ID is public configuration, not a client secret.
- Set `OPERATOR_EMAIL_ALLOWLIST` on that service to an operator-approved real email, privately in provider-native configuration. Never hardcode it in source; absent allowlist means authenticated endpoint stays disabled.
- For a Google Identity Services web sign-in, register your **actual Vercel preview origin** under authorized JavaScript origins in Google Cloud Console, then validate a signed ID token.
- Google OAuth sign-in is distinct from Supabase OAuth 2.1 *authorization server* required for GPT custom MCP. The corporate OAuth consent draft PR #17 is a separate donor.
- Exact redirect URIs, Google provider secret, domain ownership, Workspace scopes and actual Google login are **not verified** by knowing the client ID. Do not claim they work.
- No secret values in chat or GitHub. Grant scopes only as needed; do not request Google Drive/Gmail scopes in an identity-only canary.

## Run and test
```bash
cd independent-runtime
node --test test.mjs
GOOGLE_OAUTH_CLIENT_ID=... OPERATOR_EMAIL_ALLOWLIST=... PORT=3000 node server.mjs
```
Requires Node >=22, no packages or Base44 integrations. Never expose the staging endpoint publicly before the auth and abuse protections are validated.

## Provider inventory 2026-10-11
- Strategic Minds Railway: 7 projects, including APEX Command, X1 Swarm Preview and Strategic Sandbox System.
- XPS Railway separate account: 13 projects. A second Strategic Minds Railway connector is an alias to the first account.
- Apex staging worker-v2 latest deployment FAILED in BUILD_IMAGE; both staging workers currently OFFLINE. Do not just redeploy or overwrite the only working key.
- X1 staging `uvdkzsbjackpjvpoxtyk`: 16 DEAD_LETTER `CONTROL_PLANE_AUTHORIZATION_FAILED`; no unsafe queue retries.
- **Base44 integration limit HTTP 402** verified against Cloud Browser and Super Agents messaging connectors. No runtime reliance on those app tools.
- Vercel 5-min named sandbox `smai-v2-gpt-canary-20261011`: 1 vCPU API config, 2GB memory; network deny-all, 0 inherited credential keys, artifact roundtrip succeeded. `/sys/fs/cgroup/cpu.max` exposed `max 100000`, so effective kernel CPU quota unverified. No false claim of complete resource isolation.

## Next required step (GPT-owned)
Package and test this gateway, bind **staging-only non-secret OAuth settings**, verify signed-in Google session and X1 provider-native authorization independently, then connect exactly one lease to a real isolated sandbox runner. Use a draft PR and independent validation. Existing website, DNS, user-visible production, payment and Base44 retirement are still gated.
