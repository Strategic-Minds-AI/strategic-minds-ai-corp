# Strategic Minds AI Credential Capability Broker v1

This is a server-executed capability broker, not a password manager or
universal browser-password exporter. It reuses authenticated provider
connections, Vercel environment bindings, existing Supabase identity,
and the Vault directory.

## One-time operator setup

1. Connect each account via native OAuth, plugin, or provider secret UI.
2. Delegate precise scopes: provider/account, allowed operation, environment,
   budget, and whether action-specific confirmation is required.
3. Ask GPT to perform the operation. Authorized tools call the broker,
   receive results and receipts, and never receive raw passwords.
4. Missing permissions route to the specific provider connection UI.

## Review-branch implementation

Route: POST /api/runtime/functions/credentialBroker
Authentication: Admin Supabase JWT (never an arbitrary caller label).

- action=catalog: four capability registrations and binding readiness.
- action=preflight: non-secret availability checks for a named capability.
- action=execute, capability=studio.templates.list: read gallery metadata only.
- action=execute, capability=vault.accounts.list: list owned account metadata.
- ai.gateway.readiness / studio.sync.readiness: status only.
- No arbitrary fetch, shell, SQL, tool impersonation or credential disclosure.
- No production writes and no schedules introduced.

## Extension contract

Each new adapter must bind exact provider and tenant, permitted operation,
approved argument/destination scope, authenticated identity, least privileges,
cost limits, idempotency, audit receipts, and rollback. Protected actions
always require the applicable operator confirmation. Never accept arbitrary
provider URLs, environment names, SQL, shell, or tool names from the caller.

## Important boundaries

- GPT cannot obtain credentials from unconnected accounts or bypass provider
  consent, MFA, plan entitlements, usage credits, or permission boundaries.
- Configure a user-authenticated GPT Action/OAuth or connect an authorized
  provider tool for automatic GPT invocation. This PR does not install one.
- Provider HTTP 402 integration-limit errors are not password errors.
- Existing src/server/runtime.mjs already performs the Supabase service-role
  key alias mapping. Do not duplicate credentials or export their values.
- Production activation requires independent auth, tenant, data-leak,
  authorization, rollback, and staging validation.

## Tests

Unauthenticated and nonadmin rejection, capability allowlist, missing binding,
redacted output, Vault ownership, gallery metadata projection, input bounds,
readiness, and no side-effect paths. Build standalone and verify registered route.
