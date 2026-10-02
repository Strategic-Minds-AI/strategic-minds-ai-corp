// Replaces base44.functions.invoke — routes to Railway backend.
// Falls back to Base44 for functions not yet migrated to Railway.
//
// Migrated functions are listed in MIGRATED_FUNCTIONS. As each function
// is ported to Railway, add its name here and it stops hitting Base44.

import { getAccessToken } from './supabaseClient';

const RAILWAY_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

// Functions that have been migrated to the Railway backend.
// When a function is NOT in this list, we fall back to the Base44 SDK
// (transitional — the goal is to migrate all 55 and empty this fallback).
const MIGRATED_FUNCTIONS = new Set([
  'provisionSite',
]);

export const functions = {
  async invoke(name, data = {}) {
    if (MIGRATED_FUNCTIONS.has(name) && RAILWAY_URL) {
      return _invokeRailway(name, data);
    }
    return _invokeBase44(name, data);
  },
};

async function _invokeRailway(name, data) {
  const token = await getAccessToken();
  const res = await fetch(`${RAILWAY_URL}/functions/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Railway function ${name} failed (${res.status})`);
  return { data: json };
}

// Lazy-loaded Base44 fallback — only imported when an unmigrated function is called.
let _base44Fallback = null;
async function _getBase44Fallback() {
  if (!_base44Fallback) {
    const { createClient } = await import('@base44/sdk');
    const { appParams } = await import('@/lib/app-params');
    _base44Fallback = createClient({
      ...appParams,
      serverUrl: '',
      requiresAuth: false,
    });
  }
  return _base44Fallback;
}

async function _invokeBase44(name, data) {
  const client = await _getBase44Fallback();
  return client.functions.invoke(name, data);
}