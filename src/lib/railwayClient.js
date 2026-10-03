// Frontend client for the migrated Railway backend service.
// Auth is now on Supabase — this client forwards the Supabase access token.
//
// Usage (replaces base44.functions.invoke for migrated functions):
//   import { callRailway } from '@/lib/railwayClient';
//   const res = await callRailway('provisionSite', { action: 'list' });
//
// Set VITE_RAILWAY_URL in your env to the Railway service URL.

import { functions } from '@/lib/functionClient';
export async function callRailway(functionName, payload) {
  return (await functions.invoke(functionName, payload)).data;
}