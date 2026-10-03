// SYSTEM NOTATION: Authenticate only to the owner's Vercel AI Gateway.
// Vercel supplies function identity in a request header, not an environment variable.
import { AsyncLocalStorage } from 'node:async_hooks';
const credentials = new AsyncLocalStorage();
export function withGatewayCredentials(request, callback) {
  const token = process.env.VERCEL === '1' ? request.headers.get('x-vercel-oidc-token') : undefined;
  return credentials.run(token, callback);
}
export function getGatewayCredential() {
  return process.env.AI_GATEWAY_API_KEY || credentials.getStore() || process.env.VERCEL_OIDC_TOKEN;
}