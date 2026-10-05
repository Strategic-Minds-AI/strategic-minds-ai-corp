import test from 'node:test';
import assert from 'node:assert/strict';
import { entityAdapter } from './database.mjs';

test('Chat uses the timestamps emitted by its database schema', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_KEY;
  const urls = [];
  process.env.SUPABASE_URL = 'https://database.example.test';
  process.env.SUPABASE_SERVICE_KEY = 'test-only';
  globalThis.fetch = async url => {
    urls.push(new URL(url));
    return Response.json([{ id: 'saved-turn', created_date: '2026-10-05T12:00:00Z', updated_date: '2026-10-05T12:00:00Z' }]);
  };
  try {
    const conversations = entityAdapter('AdminConversation', null, true);
    await conversations.filter({ owner_id: 'owner' }, 'created_date', 40);
    const turns = entityAdapter('AdminChatTurn', null, true);
    const page = await turns.filter({ owner_id: 'owner' }, { fields: ['created_date', 'updated_date'], limit: 40 });
    assert.equal(urls[0].searchParams.get('order'), 'created_date.asc,id.asc');
    assert.equal(urls[1].searchParams.get('order'), 'created_date.desc,id.asc');
    assert.equal(urls[1].searchParams.get('select'), 'id,created_date,updated_date');
    assert.equal(page.items[0].created_date, '2026-10-05T12:00:00Z');
    await entityAdapter('User', null, true).filter({}, { limit: 1 });
    assert.equal(urls[2].searchParams.get('order'), 'created_at.desc,id.asc');
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of [['SUPABASE_URL', originalUrl], ['SUPABASE_SERVICE_KEY', originalKey]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});