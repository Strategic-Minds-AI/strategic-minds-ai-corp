import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const root = 'base44/';
const transpile = file => transformSync(readFileSync(root + file, 'utf8'), {
  loader: 'ts', format: 'esm', target: 'es2022',
}).code.replace(/^import .*$/gm, '').replace(/export\s*\{[^}]*\};?/gs, '');
const policy = transpile('shared/credentialCapabilityPolicy.ts');
const source = transpile('functions/credentialBroker/entry.ts');
let actor = { id: 'operator-1', role: 'admin' };
let bindings = new Set(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'VERCEL_AI_GATEWAY_API_KEY']);
let queryTrace = [];
const secretStore = { get: key => bindings.has(key) ? 'private-test-credential' : undefined };
const client = () => ({ asServiceRole: { entities: {
  TemplateGallery: { filter: async (query, options) => {
    queryTrace.push({ table: 'TemplateGallery', query, options });
    return { items: [{ id:'temp-1', title: 'Roofing', gallery_id: 'fortress', status:'draft',
      preview_html:'PRIVATE_HTML_MUST_NOT_ESCAPE', token:'PRIVATE_TOKEN_MUST_NOT_ESCAPE' }] };
  }},
  VaultAccount: { filter: async (query, options) => {
    queryTrace.push({ table: 'VaultAccount', query, options });
    return { items: [{ id:'vault-1', name:'Vercel', provider:'vercel',
      management_url:'https://vercel.com', password:'PRIVATE_PASSWORD_MUST_NOT_ESCAPE' }] };
  }},
} } });
const handler = new Function('secrets','getSupabaseUser','createClientFromRequest',
  policy + '\n' + source + '\nreturn credentialBroker;')(
  secretStore, async()=>actor, client);
const invoke = async (body, method = 'POST') => {
  const req = new Request('https://studio.test/functions/credentialBroker', {
    method, headers:{'Content-Type':'application/json'},
    ...(method === 'POST' ? {body: JSON.stringify(body)} : {}),
  });
  const res = await handler(req);
  return { status: res.status, headers: res.headers, json: await res.json() };
};
test('GET disallowed', async()=>assert.equal((await invoke({},'GET')).status,405));
test('denies unauthenticated caller', async()=>{actor=null; assert.equal((await invoke({action:'catalog'})).status,401);actor={id:'operator-1',role:'admin'};});
test('denies ordinary user', async()=>{actor={id:'operator-1',role:'user'};assert.equal((await invoke({action:'catalog'})).status,403);actor={id:'operator-1',role:'admin'};});
test('catalog lists only allowlisted capabilities', async()=>{const x=await invoke({action:'catalog'});assert.equal(x.status,200);assert.equal(x.json.capabilities.length,4);assert.equal(x.json.writes_enabled,false);assert.equal(x.json.credentials_returned,false);assert.equal(x.headers.get('Cache-Control'),'no-store');});
test('credential values never appear in catalog', async()=>{const x=await invoke({action:'catalog'});assert.equal(JSON.stringify(x.json).includes('private-test-credential'),false);});
test('arbitrary secret export denied', async()=>assert.equal((await invoke({action:'execute',capability:'secrets.get',name:'SUPABASE_SERVICE_KEY'})).status,403));
test('arbitrary provider call denied', async()=>assert.equal((await invoke({action:'execute',capability:'http.request',url:'https://example.test'})).status,403));
test('readiness reports missing sync credential without leaking values', async()=>{const x=await invoke({action:'preflight',capability:'studio.sync.readiness'});assert.equal(x.status,200);assert.equal(x.json.ready,false);assert.deepEqual(x.json.missing,['SERVER_SIDE_SYNC_TOKEN']);});
test('AI Gateway readiness accepts configured credential alias', async()=>{const x=await invoke({action:'preflight',capability:'ai.gateway.readiness'});assert.equal(x.json.ready,true);});
test('gallery list returns metadata, not HTML or secrets', async()=>{const x=await invoke({action:'execute',capability:'studio.templates.list',gallery_id:'fortress'});assert.equal(x.status,200);assert.equal(x.json.items.length,1);assert.equal(JSON.stringify(x.json).includes('PRIVATE_HTML'),false);assert.equal(JSON.stringify(x.json).includes('PRIVATE_TOKEN'),false);});
test('rejects unknown gallery before DB access', async()=>{const before=queryTrace.length;assert.equal((await invoke({action:'execute',capability:'studio.templates.list',gallery_id:'bad'})).status,400);assert.equal(queryTrace.length,before);});
test('rejects unbounded limit', async()=>assert.equal((await invoke({action:'execute',capability:'studio.templates.list',limit:999})).status,400));
test('Vault listing filters to authenticated owner and omits password', async()=>{const x=await invoke({action:'execute',capability:'vault.accounts.list'});assert.equal(x.status,200);assert.equal(JSON.stringify(x.json).includes('PRIVATE_PASSWORD'),false);assert.equal(JSON.stringify(x.json).includes('https://vercel.com'),false);const q=queryTrace.at(-1);assert.equal(q.table,'VaultAccount');assert.equal(q.query.created_by_id,'operator-1');});
test('missing Supabase connection blocks execution', async()=>{bindings=new Set();assert.equal((await invoke({action:'execute',capability:'studio.templates.list'})).status,503);bindings=new Set(['SUPABASE_URL','SUPABASE_SERVICE_KEY','VERCEL_AI_GATEWAY_API_KEY']);});
test('write capability is not exposed', async()=>assert.equal((await invoke({action:'execute',capability:'site.deploy',approval:'yes'})).status,403));
test('unknown actions denied', async()=>assert.equal((await invoke({action:'rotate',capability:'studio.templates.list'})).status,400));
