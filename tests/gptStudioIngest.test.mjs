import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const source = readFileSync('base44/functions/ingestPack/entry.ts', 'utf8');
const helperSource = readFileSync('base44/shared/gptStudioPack.ts', 'utf8');
const helperJs = transformSync(helperSource, { loader: 'ts', format: 'esm', target: 'es2022' }).code.replace(/export\s*\{[\s\S]*?\};/g, '');
const transpiled = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code
  .replace(/^import .*$/gm, '').replace(/export \{\s*ingestPack as default\s*\};?/g, '');
let records = [];
let broken = false;
let configured = 'a-test-token-for-unit-tests-not-real';
const client = () => ({ asServiceRole: { entities: { TemplateGallery: {
  filter: async ({gallery_id, title}) => ({items: records.filter(r => r.gallery_id === gallery_id && r.title === title)}),
  create: async row => {
    if (broken) throw new Error('service unavailable');
    const record = { ...row, id: 'example-' + (records.length + 1) };
    records.push(record);
    return record;
  }
} } } });
const environment = { get: () => configured };
const handler = new Function('createClientFromRequest', 'secrets', helperJs + '\n' + transpiled + '\nreturn ingestPack;')(client, environment);
const approval = { state: 'approved', channel: 'chatgpt_ui', approval_id: 'approval-12345678', approved_by: 'operator', approved_at: '2026-10-10T19:00:00Z' };
const pack = {name:'Test Website',gallery_id:'aurora',kind:'web_pack',preview_html:'<!doctype html><title>Test</title>',manifest:{pages:['/']},brand_tokens:{primaryColor:'#123'},status:'auto_deploy'};
const req = (body, token = configured) => new Request('https://example.test/api/runtime/functions/ingestPack',{ method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
const invoke = async(body, token)=>{const res=await handler(req(body,token));return {status:res.status,data:await res.json()}};
test('must have configured secret', async()=>{configured='';const v=await invoke({...pack,approval},'');assert.equal(v.status,503);configured='a-test-token-for-unit-tests-not-real';});
test('denies unauthorized tokens', async()=>{assert.equal((await invoke({...pack,approval},'wrong')).status,401);});
test('denies absent approval', async()=>{assert.equal((await invoke(pack)).status,403);});
test('denies fake approval channel', async()=>{assert.equal((await invoke({...pack,approval:{...approval,channel:'api'}})).status,403);});
test('denies unknown gallery', async()=>{assert.equal((await invoke({...pack,gallery_id:'not-real',approval})).status,400);});
test('rejects mixed invalid batch before writing', async()=>{const v=await invoke({items:[pack,{...pack,gallery_id:'invalid'}],approval});assert.equal(v.status,400);assert.equal(records.length,0);});
test('stores one approved item as a library draft, never queues', async()=>{const v=await invoke({...pack,approval});assert.equal(v.status,201);assert.equal(v.data.saved,1);assert.equal(v.data.published,false);assert.equal(v.data.launch_queued,false);assert.equal(records.length,1);assert.equal(records[0].status,'draft');assert.equal(records[0].gallery_name,'Aurora');assert.equal(records[0].approval_receipt.channel,'chatgpt_ui');});
test('deduplicates exact submitted content', async()=>{const v=await invoke({...pack,approval});assert.equal(v.data.duplicates,1);assert.equal(records.length,1);});
test('stores a batch across 2 galleries', async()=>{const v=await invoke({items:[{...pack,title:'Second Site',gallery_id:'fortress'},{...pack,title:'Third Site',gallery_id:'serenity'}],approval,batch_id:'sample-batch-01'});assert.equal(v.data.total,2);assert.equal(v.data.saved,2);assert.equal(records.length,3);assert.equal(records[1].gallery_name,'Fortress');assert.equal(records[2].gallery_name,'Serenity');assert.equal(records[2].batch_id,'sample-batch-01');});
test('allows versioned variation', async()=>{const v=await invoke({...pack,preview_html:'<!doctype html><title>Changed</title>',approval});assert.equal(v.data.saved,1);assert.notEqual(records[0].content_sha256,records[3].content_sha256);});
test('returns error when storage fails', async()=>{broken=true;const v=await invoke({...pack,title:'Failed Save',approval});assert.equal(v.status,503);broken=false;});
test('enforces <=100 batch entries', async()=>{const v=await invoke({items:Array.from({length:101},()=>pack),approval});assert.equal(v.status,400);});
test('rejects malformed approval ID', async()=>{const v=await invoke({...pack,approval:{...approval,approval_id:'x'}});assert.equal(v.status,403);});
