import test from 'node:test';
import assert from 'node:assert/strict';
import { getGatewayCredential, withGatewayCredentials } from './gatewayCredentials.mjs';

test('Gateway credentials prefer configured keys and isolate request identity', async () => {
  const original = { key: process.env.AI_GATEWAY_API_KEY, vercelKey: process.env.VERCEL_AI_GATEWAY_API_KEY, oidc: process.env.VERCEL_OIDC_TOKEN, host: process.env.VERCEL };
  const request = token => new Request('https://runtime.example.test', { headers: { 'x-vercel-oidc-token': token } });
  try {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    process.env.VERCEL = '1';
    assert.equal(getGatewayCredential(), undefined);
    assert.equal(await withGatewayCredentials(request('request-token'), async () => {
      await Promise.resolve();
      return getGatewayCredential();
    }), 'request-token');
    const scoped = await Promise.all(['first-token', 'second-token'].map(token => withGatewayCredentials(request(token), async () => {
      await new Promise(resolve => setTimeout(resolve, token === 'first-token' ? 10 : 1));
      return getGatewayCredential();
    })));
    assert.deepEqual(scoped, ['first-token', 'second-token']);
    assert.equal(getGatewayCredential(), undefined);
    process.env.VERCEL_AI_GATEWAY_API_KEY = 'vercel-test-key';
    process.env.VERCEL_OIDC_TOKEN = 'fallback-test-token';
    assert.equal(getGatewayCredential(), 'vercel-test-key');
    assert.equal(withGatewayCredentials(request('request-token'), getGatewayCredential), 'vercel-test-key');
    process.env.AI_GATEWAY_API_KEY = 'explicit-test-key';
    assert.equal(withGatewayCredentials(request('request-token'), getGatewayCredential), 'explicit-test-key');
    delete process.env.AI_GATEWAY_API_KEY;
    assert.equal(getGatewayCredential(), 'vercel-test-key');
    delete process.env.VERCEL_AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.VERCEL;
    assert.equal(withGatewayCredentials(request('untrusted-token'), getGatewayCredential), undefined);
    process.env.VERCEL_OIDC_TOKEN = 'local-development-token';
    assert.equal(getGatewayCredential(), 'local-development-token');
  } finally {
    for (const [name, value] of [['AI_GATEWAY_API_KEY', original.key], ['VERCEL_AI_GATEWAY_API_KEY', original.vercelKey], ['VERCEL_OIDC_TOKEN', original.oidc], ['VERCEL', original.host]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('The deployed Vercel identity produces a real AI reply', { skip: process.env.RUN_GATEWAY_SELF_CHECK !== 'true' }, async () => {
  const key = getGatewayCredential();
  assert.ok(key, 'The deployment must supply an AI Gateway credential');
  const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.AI_GATEWAY_MODEL || 'anthropic/claude-sonnet-4-5', max_tokens: 64, messages: [{ role: 'user', content: 'Connection check: reply with the single word READY.' }] }),
  });
  const result = await response.json();
  assert.equal(response.status, 200, result.error?.message || 'AI Gateway must accept the deployment identity');
  assert.equal(result.choices?.[0]?.message?.content?.trim(), 'READY');
});