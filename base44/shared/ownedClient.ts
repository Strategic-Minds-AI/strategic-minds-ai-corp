// Owned deployment composition. Falls back to the Base44 platform SDK
// when the standalone runtime hasn't been configured, so backend functions
// work in both environments.
import { createClientFromRequest as createBase44Client } from 'npm:@base44/sdk@0.8.52';

let clientFactory;
export function configureOwnedClient(factory) { clientFactory = factory; }
export function createClientFromRequest(request) {
  if (clientFactory) return clientFactory(request);
  return createBase44Client(request);
}