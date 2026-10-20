# Strategic Minds AI: Supabase OAuth 2.1 consent transition

Existing Google sign-in authenticates users to Supabase. A separate Supabase
OAuth 2.1 server will issue scoped delegated tokens to MCP clients.

## Safe routing
- /oauth/consent?authorization_id=... -> Supabase consent component.
- /oauth/consent?ctx=... -> existing Base44 MCP component unchanged.
- Invalid authorization ID displays error without Approve/Deny.
- Signed-out users return through existing /login and Google callback with a
  relative same-origin returnTo, preserving the signed OAuth request.
- Auth details, scopes and registered redirect come from Supabase's OAuth API.
- Approve/deny call Supabase OAuth SDK only. No caller-supplied redirects.

## Protected release gates
1. Verify corporate Google provider is enabled in project jadlpbokfdkonvnfxjzs.
   An OAuth client in Google Cloud does not itself prove Supabase is configured.
2. Ensure chosen host serves this consent page: strategicmindsai.com is owned
   but was not bound to the corporate Vercel project on prior inspection.
3. Confirm domain DNS and all existing sign-ins/redirects before changing
   Supabase Auth URL Configuration. Preserve authorized legacy redirect URLs.
4. Enable Supabase OAuth 2.1 server at /oauth/consent only after live consent
   route and Google sign-in canaries pass.
5. Validate MCP server OAuth discovery, PKCE, resource audience, allowed clients,
   required scopes, tenant isolation, and both approve/deny journeys.
6. Register/authorize ChatGPT as an OAuth client and run one signed-in call.

This branch DOES NOT change domains, DNS, production, Supabase OAuth settings,
registered Google credentials, client secrets, dynamic registration, or MCP tools.
Rollback: revert this PR; legacy ctx routing stays intact.
