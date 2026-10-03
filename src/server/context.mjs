// Private process-only trust: never derived from a caller-controlled HTTP header.
const identities = new WeakMap();
export function trustRequest(request, user) { identities.set(request, user); return request; }
export function trustedUser(request) { return identities.get(request); }