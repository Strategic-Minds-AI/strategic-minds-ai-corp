import test from 'node:test';
import assert from 'node:assert/strict';
import { entityAdapter } from './database.mjs';

test('Lead queries preserve created_date instead of rewriting it to created_at', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousAnon = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';

  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      json: async () => [],
    };
  };

  try {
    const request = new Request('https://strategicmindsai.com');
    await entityAdapter('Lead', request).filter({}, {
      sort: '-created_date',
      fields: ['created_date'],
      limit: 1,
    });

    const url = new URL(requestedUrl);
    assert.equal(url.searchParams.get('select'), 'id,created_date');
    assert.match(url.searchParams.get('order') || '', /^created_date\.desc/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousAnon === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousAnon;
  }
});

test('User compatibility still maps created_date to profiles.created_at', async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousAnon = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';

  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      json: async () => [],
    };
  };

  try {
    const request = new Request('https://strategicmindsai.com');
    await entityAdapter('User', request).filter({}, {
      sort: '-created_date',
      fields: ['created_date'],
      limit: 1,
    });

    const url = new URL(requestedUrl);
    assert.equal(url.searchParams.get('select'), 'id,created_at');
    assert.match(url.searchParams.get('order') || '', /^created_at\.desc/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousAnon === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousAnon;
  }
});
