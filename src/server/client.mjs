// Compatibility shape only; every operation is owned Supabase/Vercel infrastructure.
import { entityAdapter } from './database.mjs';
import { createIntegrations } from './integrations.mjs';
import { getSupabaseUser } from './auth.mjs';
import { invokeFunction } from './runtime.mjs';
import { createConnections } from './connections.mjs';
export function createClientFromRequest(request) {
  const entities = service => new Proxy({}, { get: (_, name) => entityAdapter(name, request, service) });
  const functions = { invoke: (name, payload) => invokeFunction(name, payload, request) };
  const integrations = createIntegrations(request);
  const connectors = createConnections(request);
  return {
    entities: entities(false), functions, integrations, connectors,
    auth: { me: () => getSupabaseUser(request), isAuthenticated: async () => Boolean(await getSupabaseUser(request)) },
    asServiceRole: { entities: entities(true), functions, integrations, connectors },
  };
}