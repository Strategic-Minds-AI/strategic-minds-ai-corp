import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({ entryPoints: ['base44/functions/adminAccountOverview/entry.ts'], bundle: true, platform: 'node', format: 'esm', write: false, plugins: [{ name: 'account-fixtures', setup(builder) {
  builder.onResolve({ filter: /shared\/(ownedClient|runtimeSecrets)\.ts$/ }, args => ({ path: args.path.includes('ownedClient') ? 'client' : 'secrets', namespace: 'fixtures' }));
  builder.onLoad({ filter: /.*/, namespace: 'fixtures' }, args => ({ loader: 'js', contents: args.path === 'client' ? 'export const createClientFromRequest = () => ({ auth: { me: async () => globalThis.accountFixtureUser } });' : 'export const secrets = { get: name => globalThis.accountFixtureSecrets[name] };' }));
} }] });
const { default: overview } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const request = () => new Request('https://fixture.test/functions/adminAccountOverview', { method: 'POST', body: JSON.stringify({ provider: 'vercel' }) });
const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; delete globalThis.accountFixtureUser; delete globalThis.accountFixtureSecrets; });

test('A missing deployment token returns the exact secure setup action instead of a dead retry', async () => {
  globalThis.accountFixtureUser = { id: 'fixture-admin', role: 'admin' };
  const setupUrl = 'https://vercel.com/example/team-project/settings/environment-variables';
  globalThis.accountFixtureSecrets = { VERCEL_ACCOUNT_SETTINGS_URL: setupUrl };
  globalThis.fetch = async () => { throw new Error('Missing credentials must not trigger an external request'); };
  const response = await overview(request()); const result = await response.json();
  assert.equal(response.status, 503); assert.equal(result.code, 'VERCEL_ACCOUNT_NOT_CONFIGURED');
  assert.equal(result.setupUrl, setupUrl); assert.equal(result.requiredVariable, 'VERCEL_API_TOKEN');
  assert.match(result.error, /Production/);
});

test('The Vercel projects request uses the connected team and never returns its token', async () => {
  globalThis.accountFixtureUser = { id: 'fixture-admin', role: 'admin' };
  globalThis.accountFixtureSecrets = { VERCEL_API_TOKEN: 'fixture-token', VERCEL_TEAM_ID: 'fixture-team' };
  globalThis.fetch = async (url, options) => {
    assert.equal(url.origin, 'https://api.vercel.com'); assert.equal(url.searchParams.get('teamId'), 'fixture-team');
    assert.equal(options.headers.Authorization, 'Bearer fixture-token');
    return Response.json({ projects: [{ id: 'fixture-project', name: 'Connected project', framework: 'vite' }] });
  };
  const response = await overview(request()); const text = await response.text();
  assert.equal(response.status, 200); assert.ok(!text.includes('fixture-token'));
  assert.equal(JSON.parse(text).items[0].name, 'Connected project');
});

test('Account access still rejects non-admin users before using an account credential', async () => {
  globalThis.accountFixtureUser = { id: 'fixture-user', role: 'user' };
  globalThis.fetch = async () => { throw new Error('Non-admin requests must never reach Vercel'); };
  assert.equal((await overview(request())).status, 403);
});