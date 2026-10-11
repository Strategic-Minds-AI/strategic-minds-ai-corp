import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { buildGoogleVerifier } from './google-auth.mjs';
import { createCommandGateway } from './server.mjs';
const clientId='204537989581-iv4b7lk2637oaadkucadrpr0gonbgjto.apps.googleusercontent.com';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const key={...publicKey.export({format:'jwk'}),kid:'canary-key',use:'sig',alg:'RS256'};
const mk=(claims={},header={})=>{
 const h=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:'canary-key',...header})).toString('base64url');
 const p=Buffer.from(JSON.stringify({iss:'https://accounts.google.com',aud:clientId,exp:2000004000,iat:2000000000,sub:'google-sub-123456',email:'operator@example.com',email_verified:true,...claims})).toString('base64url');
 return h+'.'+p+'.'+sign('RSA-SHA256',Buffer.from(h+'.'+p),privateKey).toString('base64url');
};
const make=()=>buildGoogleVerifier({clientId,allowedEmails:['operator@example.com'],fetchJwks:async()=>({keys:[key]}),nowSeconds:()=>2000000100});
test('valid signed token authorizes exact operator and audience',async()=>{const actor=await make()(mk());assert.equal(actor.tenantKey,'google:google-sub-123456');});
test('reject unsupported none algorithm',async()=>assert.rejects(make()(mk({}, {alg:'none'})),/signing/));
test('reject wrong Google audience',async()=>assert.rejects(make()(mk({aud:'fake-client'})),/audience/));
test('reject wrong issuer',async()=>assert.rejects(make()(mk({iss:'https://attacker.test'})),/Issuer/));
test('reject expired token',async()=>assert.rejects(make()(mk({exp:2000000000})),/timestamp/));
test('reject future issued token',async()=>assert.rejects(make()(mk({iat:2000009000})),/timestamp/));
test('reject future nbf',async()=>assert.rejects(make()(mk({nbf:2000009000})),/not yet/));
test('reject unverified email',async()=>assert.rejects(make()(mk({email_verified:false})),/unauthorized/));
test('reject email not allowlisted',async()=>assert.rejects(make()(mk({email:'other@example.com'})),/unauthorized/));
test('reject token signature tampering',async()=>{const t=mk();const a=t.split('.');a[1]=Buffer.from(JSON.stringify({aud:clientId,email:'operator@example.com',sub:'evil',iss:'https://accounts.google.com',exp:2000004000,iat:2000000000,email_verified:true})).toString('base64url');await assert.rejects(make()(a.join('.')),/signature/);});
test('reject missing allowlist configuration',()=>assert.throws(()=>buildGoogleVerifier({clientId,allowedEmails:[]}),/allowlist/));
test('reject malformed client ID configuration',()=>assert.throws(()=>buildGoogleVerifier({clientId:'bad',allowedEmails:['operator@example.com']}),/client ID/));
async function withServer(auth,cb){
 const server=createCommandGateway({auth});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{return await cb('http://127.0.0.1:'+server.address().port)}finally{await new Promise(r=>server.close(r));}
}
test('health exposes no dependency and never misstates readiness',async()=>withServer(null,async url=>{const r=await fetch(url+'/health');const data=await r.json();assert.equal(data.base44RuntimeDependency,false);assert.equal(data.readyForAuthenticatedPlans,false);assert.equal(data.x1QueueWriteEnabled,false);}));
test('endpoint fails closed when verifier unavailable',async()=>withServer(null,async url=>{const r=await fetch(url+'/v1/mission/plan',{method:'POST'});assert.equal(r.status,503);}));
test('reject unauthenticated mission plan',async()=>withServer(make(),async url=>{const r=await fetch(url+'/v1/mission/plan',{method:'POST'});assert.equal(r.status,401);}));
test('signed Google identity produces planning-only mission receipt',async()=>withServer(make(),async url=>{const r=await fetch(url+'/v1/mission/plan',{method:'POST',headers:{authorization:'Bearer '+mk(),'content-type':'application/json'},body:JSON.stringify({project_id:'smai-v2-internal',instruction:'Build isolated preview website with validation evidence'})});assert.equal(r.status,200);const d=await r.json();assert.equal(d.queue_dispatched,false);assert.equal(d.production_authorized,false);assert.match(d.mission_id,/^smai_v2_/);assert.equal(JSON.stringify(d).includes('Build isolated'),false);}));
test('reject user-requested production or spend',async()=>withServer(make(),async url=>{for(const f of [{production:true},{spend_usd:1},{override_approvals:true}]){const r=await fetch(url+'/v1/mission/plan',{method:'POST',headers:{authorization:'Bearer '+mk()},body:JSON.stringify({project_id:'smai-v2-internal',instruction:'Build isolated preview website',...f})});assert.equal(r.status,403);}}));
test('reject bad typed job',async()=>withServer(make(),async url=>{const r=await fetch(url+'/v1/mission/plan',{method:'POST',headers:{authorization:'Bearer '+mk()},body:JSON.stringify({project_id:'bad',instruction:'short'})});assert.equal(r.status,400);}));
test('reject unknown endpoints',async()=>withServer(make(),async url=>{const r=await fetch(url+'/admin/secrets');assert.equal(r.status,404);}));
