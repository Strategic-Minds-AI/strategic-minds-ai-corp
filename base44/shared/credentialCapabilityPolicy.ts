import { secrets } from './runtimeSecrets.ts';

export const CATALOG = {
  'studio.templates.list': { provider: 'supabase', mode: 'read', bindings: ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'] },
  'vault.accounts.list': { provider: 'supabase', mode: 'read', bindings: ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'] },
  'ai.gateway.readiness': { provider: 'vercel', mode: 'metadata', bindings_any: ['AI_GATEWAY_API_KEY', 'VERCEL_AI_GATEWAY_API_KEY'] },
  'studio.sync.readiness': { provider: 'vercel', mode: 'metadata', bindings: ['SERVER_SIDE_SYNC_TOKEN'] },
} as const;

export const GALLERY_IDS = new Set([
  'aurora', 'fortress', 'serenity', 'momentum', 'heritage',
  'pulse', 'summit', 'bloom', 'forge', 'lumin', 'terra',
  'velocity', 'haven', 'crystal', 'sage', 'apex', 'beacon',
  'prism', 'grid', 'wave',
]);

export type Capability = keyof typeof CATALOG;
export const hasCapability = (id: string): id is Capability =>
  Object.hasOwn(CATALOG, id);

export function capabilityReadiness(id: Capability) {
  const item = CATALOG[id] as {
    provider: string; mode: string; bindings?: readonly string[];
    bindings_any?: readonly string[];
  };
  const missing = (item.bindings || []).filter(name => !secrets.get(name));
  const any = item.bindings_any || [];
  if (any.length && !any.some(name => Boolean(secrets.get(name)))) {
    missing.push('configured provider credential');
  }
  return {
    id,
    provider: item.provider,
    mode: item.mode,
    ready: missing.length === 0,
    missing,
    raw_credentials_exposed: false,
  };
}
