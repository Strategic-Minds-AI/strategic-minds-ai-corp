import { getAccessToken } from '@/lib/supabaseClient';
import { runtimeRequest } from '@/lib/runtimeTransport';

export async function issueOnboardingToken(payload) {
  return runtimeRequest('/client-factory/token', payload, { token: await getAccessToken() });
}
export async function edenClientTurn(payload) {
  return runtimeRequest('/client-factory/chat', payload);
}
export async function enqueueWebsiteBatch(payload) {
  return runtimeRequest('/client-factory/batch', payload, { token: await getAccessToken() });
}
export async function enqueueSocialContent(payload) {
  return runtimeRequest('/client-factory/social', payload, { token: await getAccessToken() });
}
