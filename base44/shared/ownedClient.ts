// Compatibility entry point for the owner's runtime, never a platform SDK.
// The independent build binds this module to its native Supabase client via
// configureOwnedClient(). In the hosted Base44 runtime no factory is bound, so
// we lazily delegate to the platform SDK (npm:@base44/sdk) — this keeps every
// system function working without touching call sites. The dynamic import is
// only evaluated when no factory is configured, so the dependency-free
// standalone build never reaches it.
let clientFactory;
export function configureOwnedClient(factory) { clientFactory = factory; }

let platformModulePromise;

function deferredClient(request, path) {
  const target = function () {};
  return new Proxy(target, {
    get(_t, prop) {
      if (typeof prop === 'symbol') return undefined;
      const name = String(prop);
      if (name === 'then' || name === 'catch' || name === 'finally') return undefined;
      return deferredClient(request, [...path, name]);
    },
    apply(_t, _thisArg, args) {
      if (!platformModulePromise) platformModulePromise = import('npm:@base44/sdk@0.8.52');
      return platformModulePromise.then((mod) => {
        const client = mod.createClientFromRequest(request);
        let cur = client;
        for (const p of path) cur = cur?.[p];
        return typeof cur === 'function' ? cur(...args) : cur;
      });
    },
  });
}

export function createClientFromRequest(request) {
  if (clientFactory) return clientFactory(request);
  return deferredClient(request, []);
}