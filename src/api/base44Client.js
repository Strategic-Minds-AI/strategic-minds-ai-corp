// Legacy name retained for existing screens; no platform SDK, requests or fallbacks.
import { agents, connectors } from '@/lib/agentsAdapter';
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
  agents,
  connectors,
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