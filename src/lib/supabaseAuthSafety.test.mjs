import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { clearInvalidSupabaseSession } from './supabaseSessionStorage.js';
import supabaseFetch from './supabaseFetch.js';

const key = 'sb-project-auth-token';
const origin = 'https://project.supabase.co';
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'test-user', exp: 4102444800 })}.signature`;
const session = { access_token: token, refresh_token: 'test-refresh', expires_at: 4102444800, token_type: 'bearer', user: { id: 'test-user' } };
function storage(raw) {
  const items = new Map([[key, raw], [`${key}-user`, '{}'], ['sb-other-auth-token', 'unrelated-session']]);
  return { getItem: name => items.get(name) ?? null, setItem: (name, value) => items.set(name, value), removeItem: name => items.delete(name) };
}

test('Empty and truncated sessions are removed without deleting another project', () => {
  for (const raw of ['', '{', '{"access_token":']) {
    const saved = storage(raw);
    assert.equal(clearInvalidSupabaseSession(key, saved), true);
    assert.equal(saved.getItem(key), null);
    assert.equal(saved.getItem(`${key}-user`), null);
    assert.equal(saved.getItem('sb-other-auth-token'), 'unrelated-session');
  }
});

test('Valid JSON containing a malformed token is rejected before initialization', () => {
  for (const access_token of ['', 'e30..signature', 'e30.eA.signature', 'e30.bnVsbA.signature']) {
    const saved = storage(JSON.stringify({ ...session, access_token }));
    assert.equal(clearInvalidSupabaseSession(key, saved), true);
  }
});

test('Healthy and expired sessions are preserved for the SDK to restore or refresh', () => {
  for (const expires_at of [4102444800, 1]) {
    const raw = JSON.stringify({ ...session, expires_at });
    const saved = storage(raw);
    assert.equal(clearInvalidSupabaseSession(key, saved), false);
    assert.equal(saved.getItem(key), raw);
  }
});

test('Unavailable storage does not crash public pages', () => {
  assert.equal(clearInvalidSupabaseSession(key, { getItem() { throw new Error('Unavailable'); } }), false);
});

test('Incomplete auth responses include HTTP status and path, never tokens or query strings', async t => {
  for (const [body, status] of [['', 200], ['', 401], ['{"user":', 200], ['<html>Error</html>', 503], ['null', 200]]) {
    t.mock.method(globalThis, 'fetch', async () => new Response(body, { status }));
    await assert.rejects(supabaseFetch(`${origin}/auth/v1/token?secret=not-for-display`), error => {
      assert.equal(error.status, status);
      assert.equal(error.path, '/auth/v1/token');
      assert.match(error.message, new RegExp(`HTTP ${status}`));
      assert.doesNotMatch(error.message, /not-for-display|Unexpected end/);
      return true;
    });
    t.mock.restoreAll();
  }
});

test('Valid authentication success and credential errors remain unchanged', async t => {
  for (const [body, status] of [[{ access_token: token }, 200], [{ msg: 'Invalid login credentials' }, 400]]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json(body, { status }));
    const response = await supabaseFetch(`${origin}/auth/v1/token`);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), body);
    t.mock.restoreAll();
  }
});

test('Logout and non-auth responses retain their bodyless or non-JSON behavior', async t => {
  for (const [path, status, method] of [['/auth/v1/logout', 200, 'POST'], ['/auth/v1/logout', 204, 'POST'], ['/rest/v1/profiles', 204, 'PATCH'], ['/storage/v1/object/file', 200, 'GET']]) {
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status }));
    const response = await supabaseFetch(`${origin}${path}`, { method });
    assert.equal(response.status, status);
    t.mock.restoreAll();
  }
});

test('Network failures include the auth path without leaking query parameters', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(supabaseFetch(`${origin}/auth/v1/user?token=private`), error => {
    assert.equal(error.status, 0);
    assert.match(error.message, /\/auth\/v1\/user \(HTTP unavailable\)/);
    assert.doesNotMatch(error.message, /private/);
    return true;
  });
});

test('The real SDK can restore after invalid storage is removed and then sign in', async t => {
  const saved = storage(JSON.stringify({ ...session, access_token: 'e30..signature' }));
  clearInvalidSupabaseSession(key, saved);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...session, expires_in: 3600 }));
  const client = createClient(origin, 'test-public-key', { global: { fetch: supabaseFetch }, auth: { storage: saved, storageKey: key, autoRefreshToken: false, detectSessionInUrl: false } });
  assert.equal((await client.auth.initialize()).error, null);
  assert.equal((await client.auth.getSession()).data.session, null);
  const signedIn = await client.auth.signInWithPassword({ email: 'user@example.test', password: 'test-password' });
  assert.equal(signedIn.error, null);
  assert.equal(signedIn.data.session.access_token, token);
  assert.equal(JSON.parse(saved.getItem(key)).access_token, token);
});

test('The real SDK surfaces incomplete replies without wiping a healthy session', async t => {
  const raw = JSON.stringify(session);
  const saved = storage(raw);
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 200 }));
  const client = createClient(origin, 'test-public-key', { global: { fetch: supabaseFetch }, auth: { storage: saved, storageKey: key, autoRefreshToken: false, detectSessionInUrl: false } });
  const { error } = await client.auth.getUser();
  assert.match(error.message, /empty response at \/auth\/v1\/user \(HTTP 200\)/);
  assert.equal(saved.getItem(key), raw);
});