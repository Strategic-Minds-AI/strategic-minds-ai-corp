// Frontend client for the migrated Railway backend service.
// Auth stays on Base44 — this client forwards the Base44 access token
// to Railway, which validates it via the auth bridge.
//
// Usage (replaces base44.functions.invoke for migrated functions):
//   import { callRailway } from '@/lib/railwayClient';
//   const res = await callRailway('provisionSite', { action: 'list' });
//
// Set VITE_RAILWAY_URL in your env to the Railway service URL.

import { base44 } from '@/api/base44Client';

const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL || '';

function getToken() {
  // The Base44 SDK stores the access token in localStorage under a known key.
  try {
    const raw = localStorage.getItem('base44_access_token') || localStorage.getItem('sb-access-token');
    if (raw) return raw;
  } catch {}
  return null;
}

export async function callRailway(functionName, payload) {
  if (!RAILWAY_URL) throw new Error('VITE_RAILWAY_URL not set — cannot reach Railway backend');
  const token = getToken();
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