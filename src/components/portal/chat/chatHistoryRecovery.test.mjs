import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import chatHistoryRecovery, { loadChatSnapshot } from './chatHistoryRecovery.js';
import { readOutbox, enqueueOperation, removeOperation } from './chatHistoryOutbox.js';

test('Broken browser history preserves live history and does not block new chat', async () => {
  const saved = [{ id: 'account-chat', messages: [] }];
  const state = await loadChatSnapshot(async () => saved, () => { throw new Error('Invalid cached queue'); });
  assert.equal(state.chats, saved);
  assert.match(state.warning, /Invalid cached queue/);
  let flushed = false; let loaded = 0;
  const warning = await chatHistoryRecovery(async () => { loaded++; return state.warning; }, [
    async () => { throw new Error('Invalid legacy message'); },
    async () => { flushed = true; throw new Error('Unsaved result needs synchronization'); },
  ]);
  assert.equal(flushed, true);
  assert.equal(loaded, 2);
  assert.match(warning, /Invalid legacy message/);
  assert.match(warning, /Unsaved result needs synchronization/);
  const hook = readFileSync(new URL('./useAdminChatHistory.js', import.meta.url), 'utf8');
  assert.ok(hook.includes('ready: ready && !loading && scope === ownerId'));
  assert.ok(!hook.includes('ready && !loading && !error'));
});

test('Unreadable browser queues are preserved while new answers can synchronize', () => {
  const original = globalThis.localStorage;
  const key = 'strategic-admin-chat-outbox-corrupt-owner';
  const stored = new Map([[key, '{broken']]);
  globalThis.localStorage = { getItem: name => stored.get(name) ?? null, setItem: (name, value) => stored.set(name, value), removeItem: name => stored.delete(name) };
  try {
    assert.throws(() => readOutbox('corrupt-owner'), /kept unchanged/);
    const answer = { action: 'complete', chatKey: 'new-chat', turnKey: 'new-turn', assistantMessage: { role: 'assistant', content: 'Saved answer' } };
    enqueueOperation('corrupt-owner', answer);
    assert.deepEqual(readOutbox('corrupt-owner'), [answer]);
    removeOperation('corrupt-owner', answer);
    assert.deepEqual(readOutbox('corrupt-owner'), []);
    assert.equal(stored.get(key), '{broken');
  } finally { globalThis.localStorage = original; }
});

test('Account authentication failure still blocks history recovery', async () => {
  let restored = false;
  await assert.rejects(chatHistoryRecovery(async () => { throw new Error('Unauthorized'); }, [
    async () => { restored = true; },
  ]), /Unauthorized/);
  assert.equal(restored, false);
  await assert.rejects(loadChatSnapshot(async () => { throw new Error('Unauthorized'); }, value => value), /Unauthorized/);
});