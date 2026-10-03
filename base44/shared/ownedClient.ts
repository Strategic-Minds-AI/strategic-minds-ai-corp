// Owned deployment composition. This module has no platform SDK or hosted fallback.
let clientFactory;
export function configureOwnedClient(factory) { clientFactory = factory; }
export function createClientFromRequest(request) {
  if (!clientFactory) throw new Error('NOT_CONFIGURED: Start the independent Strategic Minds runtime.');
  return clientFactory(request);
}