// Frontend client for the migrated Railway backend service.
// Auth is now on Supabase — this client forwards the Supabase access token.
//
// Usage (replaces base44.functions.invoke for migrated functions):
//   import { callRailway } from '@/lib/railwayClient';
//   const res = await callRailway('provisionSite', { action: 'list' });
//
// Set VITE_RAILWAY_URL in your env to the Railway service URL.

import { getAccessToken } from '@/lib/supabaseAuthClient';

const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL || '';

export async function callRailway(functionName, payload) {
  if (!RAILWAY_URL) throw new Error('VITE_RAILWAY_URL not set — cannot reach Railway backend');
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${RAILWAY_URL}/functions/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Railway request failed (${res.status})`);
  return data;
}