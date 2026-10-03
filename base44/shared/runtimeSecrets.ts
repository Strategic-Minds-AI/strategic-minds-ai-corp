// Runtime credentials are supplied only by the owner's hosting environment.
export const secrets = {
  get(name) { return process.env[name] || (name === 'BASE44_APP_ID' ? process.env.APP_ID : name === 'AI_GATEWAY_API_KEY' ? process.env.VERCEL_OIDC_TOKEN : undefined); },
};
export function waitUntil(promise) { promise.catch(error => console.error('Background operation failed:', error.message)); }