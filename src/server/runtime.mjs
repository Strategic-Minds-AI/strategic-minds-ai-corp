// Owned runtime configuration, populated by the standalone build.
import { trustedUser, trustRequest } from './context.mjs';
export const runtime = { handlers: {}, schemas: {}, tables: {}, agents: {} };
export function configureRuntime(config) {
  if (!process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  Object.assign(runtime, config);
}
export const secrets = { get: name => process.env[name] || (name === 'BASE44_APP_ID' ? process.env.APP_ID : undefined) };
export function waitUntil(promise) { promise.catch(error => console.error('Background operation failed', error.message)); }
export function notConfigured(service) { return Object.assign(new Error(`NOT_CONFIGURED: ${service}`), { code: 'NOT_CONFIGURED', status: 503 }); }
export async function invokeFunction(name, payload, parentRequest) {
  const handler = runtime.handlers[name];
  if (!handler) throw Object.assign(new Error(`Unknown function: ${name}`), { status: 404 });
  const headers = new Headers(parentRequest?.headers);
  headers.set('Content-Type', 'application/json');
  const request = new Request(`https://runtime.internal/functions/${encodeURIComponent(name)}`, { method: 'POST', headers, body: JSON.stringify(payload || {}) });
  if (trustedUser(parentRequest)) trustRequest(request, trustedUser(parentRequest));
  const response = await handler(request);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || `Function ${name} failed`), { status: response.status });
  return { data, status: response.status };
}