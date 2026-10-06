import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { build } from 'esbuild';
const fixturePlugin = { name: 'history-contract-fixtures', setup(builder) {
  builder.onResolve({ filter: /shared\/(ownedClient|supabaseAuth)\.ts$/ }, args => ({ path: args.path.includes('ownedClient') ? 'client' : 'auth', namespace: 'fixtures' }));
  builder.onResolve({ filter: /^@\/api\/base44Client$/ }, () => ({ path: 'frontend', namespace: 'fixtures' }));
  builder.onLoad({ filter: /.*/, namespace: 'fixtures' }, args => ({ loader: 'js', contents: args.path === 'client'
    ? 'export const createClientFromRequest = () => globalThis.historyFixtureDb;'
    : args.path === 'auth' ? 'export const getSupabaseUser = async () => globalThis.historyFixtureUser;'
    : 'export const base44 = { functions: { invoke: (name, payload) => globalThis.historyFixtureInvoke(name, payload) } };' }));
} };
async function moduleFrom(options) {
  const compiled = await build({ ...options, bundle: true, platform: 'node', format: 'esm', write: false, alias: { '@': resolve('src') }, plugins: [fixturePlugin] });
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
}
const { default: handler } = await moduleFrom({ entryPoints: ['base44/functions/adminChatHistory/entry.ts'] });
const client = await moduleFrom({ stdin: { resolveDir: process.cwd(), contents: `
export { historyRequest } from './src/components/portal/chat/chatHistoryApi.js';
export { default as migrate } from './src/components/portal/chat/migrateChatHistory.js';
export { default as synchronize } from './src/components/portal/chat/synchronizeChatOutbox.js';
export { enqueueOperation, readOutbox } from './src/components/portal/chat/chatHistoryOutbox.js';` } });
function fixture() {
  const storage = new Map(); const tables = { AdminConversation: [], AdminChatTurn: [] }; let counter = 0;
  const match = (row, query) => Object.entries(query).every(([key, value]) => key === '$or' ? value.some(part => match(row, part)) : value && typeof value === 'object' ? ('$lt' in value ? row[key] < value.$lt : '$in' in value ? value.$in.includes(row[key]) : false) : row[key] === value);
  const entities = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, {
    filter: async query => rows.filter(row => match(row, query)),
    create: async data => { const row = { ...data, id: `fixture-${++counter}`, created_date: new Date().toISOString() }; rows.push(row); return row; },
    update: async (id, change) => Object.assign(rows.find(row => row.id === id), change),
    updateMany: async (query, change) => { rows.filter(row => match(row, query)).forEach(row => Object.assign(row, change.$set)); return { has_more: false }; },
    deleteMany: async query => { const removed = rows.filter(row => match(row, query)); removed.forEach(row => rows.splice(rows.indexOf(row), 1)); return { deleted: removed.length }; },
  }]));
  globalThis.historyFixtureDb = { entities };
  globalThis.historyFixtureUser = { id: 'fixture-admin', role: 'admin' };
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const requests = [];
  globalThis.historyFixtureInvoke = async (name, payload) => {
    assert.equal(name, 'adminChatHistory'); requests.push(payload);
    const response = await handler(new Request('https://fixture.test/functions/adminChatHistory', { method: 'POST', body: JSON.stringify(payload) }));
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error), { response: { status: response.status, data } });
    return { data };
  };
  return { storage, tables, requests };
}
const originalStorage = globalThis.localStorage;
test.after(() => { globalThis.localStorage = originalStorage; delete globalThis.historyFixtureDb; delete globalThis.historyFixtureUser; delete globalThis.historyFixtureInvoke; });

test('Legacy display metadata imports through the real history handler without losing message text', async () => {
  const { storage, tables, requests } = fixture();
  const userMessage = { role: 'user', content: 'Original question', turnKey: 'old-turn', deliveryStatus: 'complete', attachments: [] };
  const assistantMessage = { role: 'assistant', content: 'Original answer\nwith its full text.', turnKey: 'old-turn', syncPending: true, imageUrl: null, savedUrl: '' };
  const key = 'strategic-admin-chats-fixture-admin';
  const raw = JSON.stringify([{ id: 'legacy-chat-01', title: 'Existing conversation', messages: [userMessage, assistantMessage] }]);
  storage.set(key, raw);
  await client.migrate('fixture-admin');
  assert.equal(storage.has(key), false);
  assert.equal(tables.AdminChatTurn.length, 1);
  assert.deepEqual(tables.AdminChatTurn[0].user_message, { role: 'user', content: userMessage.content, attachments: [] });
  assert.deepEqual(tables.AdminChatTurn[0].assistant_message, { role: 'assistant', content: assistantMessage.content });
  assert.ok(!('turnKey' in requests[0].userMessage));
  storage.set(key, raw); await client.migrate('fixture-admin');
  assert.equal(tables.AdminChatTurn.length, 1, 'Retrying an import must not duplicate it');
});

test('Retry synchronization saves an old queued reply and drains its exact operation', async () => {
  const { tables } = fixture();
  await client.historyRequest('fixture-admin', 'begin', { chatKey: 'queue-chat-01', turnKey: 'queue-turn-01', title: 'Queued reply', userMessage: { role: 'user', content: 'Question' } });
  const payload = { action: 'complete', chatKey: 'queue-chat-01', turnKey: 'queue-turn-01', assistantMessage: { role: 'assistant', content: 'Saved reply', turnKey: 'queue-turn-01', syncPending: true, savedUrl: 'https://drive.google.com/file/d/fixture' } };
  client.enqueueOperation('fixture-admin', payload);
  await client.synchronize('fixture-admin');
  assert.equal(client.readOutbox('fixture-admin').length, 0);
  assert.equal(tables.AdminChatTurn[0].status, 'complete');
  assert.deepEqual(tables.AdminChatTurn[0].assistant_message, { role: 'assistant', content: 'Saved reply', savedUrl: payload.assistantMessage.savedUrl });
  assert.equal(payload.assistantMessage.syncPending, true, 'Normalization must not mutate the retained original');
});

test('Oversized legacy messages remain intact and receive an actionable validation error', async () => {
  const { storage, tables } = fixture(); const key = 'strategic-admin-chats-fixture-admin';
  const raw = JSON.stringify([{ id: 'large-chat-01', title: 'Large message', messages: [{ role: 'user', content: 'x'.repeat(60001) }] }]);
  storage.set(key, raw);
  await assert.rejects(client.migrate('fixture-admin'), /60,000-character limit/);
  assert.equal(storage.get(key), raw); assert.equal(tables.AdminChatTurn.length, 0);
});

test('History ownership and strict server validation remain enforced', async () => {
  fixture();
  const payload = { action: 'begin', ownerId: 'other-admin', chatKey: 'secure-chat-01', turnKey: 'secure-turn-01', title: 'Owner test', userMessage: { role: 'user', content: 'Question' } };
  const request = body => handler(new Request('https://fixture.test', { method: 'POST', body: JSON.stringify(body) }));
  assert.equal((await request(payload)).status, 403);
  const malformed = await request({ ...payload, ownerId: 'fixture-admin', userMessage: { ...payload.userMessage, injectedField: true } });
  assert.equal(malformed.status, 400); assert.match((await malformed.json()).error, /unsupported history fields/);
  const empty = await request({ ...payload, ownerId: 'fixture-admin', userMessage: { role: 'user', content: '' } });
  assert.equal(empty.status, 400);
  globalThis.historyFixtureUser = { id: 'fixture-user', role: 'user' };
  assert.equal((await request({ ...payload, ownerId: 'fixture-user' })).status, 403);
});