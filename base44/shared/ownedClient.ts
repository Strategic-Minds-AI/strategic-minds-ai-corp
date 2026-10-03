// Compatibility entry point for the owner's runtime, never a platform SDK.
// The independent build binds this module to its native Supabase client.
let clientFactory;
export function configureOwnedClient(factory) { clientFactory = factory; }
export function createClientFromRequest(request) {
  if (!clientFactory) throw Object.assign(new Error('Deploy the independent backend before invoking system functions. No platform fallback is enabled.'), { code: 'OWNED_RUNTIME_REQUIRED', status: 503 });
  return clientFactory(request);
}