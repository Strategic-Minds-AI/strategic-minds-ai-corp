// ──────────────────────────────────────────────────────────────
// base44Client — Supabase-backed drop-in replacement for the Base44 SDK.
//
// This file exports `base44` with the same API shape as @base44/sdk:
//   base44.entities.<Name>.filter/list/get/create/update/delete/count/...
//   base44.functions.invoke(name, data)
//   base44.integrations.Core.InvokeLLM/SendEmail/UploadPrivateFile/...
//   base44.auth.me/isAuthenticated/logout/updateMe/redirectToLogin
//   base44.users.inviteUser(email, role)
//   base44.analytics.track(event)
//   base44.setToken(token)
//
// Under the hood, entities hit Supabase, functions route to Railway
// (falling back to Base44 for unmigrated functions), and integrations
// use direct implementations (Vercel AI Gateway, Railway endpoints).
//
// The Base44 SDK is only lazy-loaded as a fallback for unmigrated
// functions/integrations. Once all 55 functions are on Railway and
// env vars are set, the @base44/sdk import is never reached.
// ──────────────────────────────────────────────────────────────

import { entityAdapter } from '@/lib/entityAdapter';
import { functions } from '@/lib/functionClient';
import { integrations } from '@/lib/integrationAdapter';
import { auth, users, analytics } from '@/lib/authAdapter';

// entities is a Proxy that returns an adapter for any entity name,
// matching the base44.entities.<Name> access pattern.
const entities = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop === 'string') return entityAdapter(prop);
    return undefined;
  },
});

// Token store — setToken is called by AuthContext when the Supabase
// session is restored. The token is forwarded to Railway via the
// Authorization header in functionClient.js / integrationAdapter.js.
let _currentToken = null;

export const base44 = {
  entities,
  functions,
  integrations,
  auth,
  users,
  analytics,
  setToken(token) { _currentToken = token; },
  getToken() { return _currentToken; },
  // asServiceRole is only meaningful in backend functions (server-side).
  // On the client it's a no-op passthrough — backend functions use the
  // Supabase service role key directly from process.env.
  asServiceRole: null,
};