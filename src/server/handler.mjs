import './registry.mjs';
import { runtime, invokeFunction, notConfigured, secrets } from './runtime.mjs';
import { withGatewayCredentials } from './gatewayCredentials.mjs';
import { requireUser } from './auth.mjs';
import { createIntegrations } from './integrations.mjs';
import { databaseRequest } from './database.mjs';
import { conversationAction } from './conversations.mjs';
import { connectAccount, completeConnection, disconnectAccount } from './connections.mjs';
import { tickJobs } from './jobs.mjs';
import { createHmac, timingSafeEqual } from 'node:crypto';
const publicFunctions = new Set(['getAuthConfig','commerceCheckout','commerceQuote','captureAgencyLead','commerceWebhook','twilioWebhook','sandboxAuth','benchmarkCostRenewal','vaultDirectory']);
async function checkTwilio(request) {
  if(!process.env.TWILIO_AUTH_TOKEN || !process.env.API_URL) throw notConfigured('Twilio webhook configuration');
  const form=new URLSearchParams(await request.clone().text());
  const url=`${process.env.API_URL.replace(/\/$/,'')}/functions/twilioWebhook`;
  const input=url+[...form.keys()].sort().map(key=>key+form.get(key)).join('');
  const expected=createHmac('sha1',process.env.TWILIO_AUTH_TOKEN).update(input).digest('base64');
  const actual=request.headers.get('X-Twilio-Signature') || '';
  if(actual.length!==expected.length || !timingSafeEqual(Buffer.from(actual),Buffer.from(expected))) throw Object.assign(new Error('Invalid webhook signature'),{status:403});
}
export async function handleRequest(request) {
  return withGatewayCredentials(request, async () => {
  try {
    const url=new URL(request.url);let path=url.pathname.replace(/^\/api\/runtime/,'');
    if(url.searchParams.get('route')) path='/'+url.searchParams.get('route').replace(/^\//,'');
    if(path==='/health') return Response.json({ok:true,service:'strategic-minds-runtime',ai:'vercel-ai-gateway',aiConfigured:Boolean(secrets.get('AI_GATEWAY_API_KEY')),functions:Object.keys(runtime.handlers).length});
    if(path==='/connections/callback') return completeConnection(request);
    if(path==='/jobs/tick') { if(!process.env.CRON_SECRET || request.headers.get('Authorization')!==`Bearer ${process.env.CRON_SECRET}`) return Response.json({error:'Unauthorized'},{status:401});return Response.json(await tickJobs()); }
    if(path==='/channels/whatsapp') { if(!process.env.WHATSAPP_ASSISTANT_NUMBER) throw notConfigured('Twilio WhatsApp assistant channel');return Response.redirect(`https://wa.me/${process.env.WHATSAPP_ASSISTANT_NUMBER.replace(/\D/g,'')}`); }
    const name=/^\/functions\/([\w-]+)$/.exec(path)?.[1];
    if(name) {
      if(name==='getAuthConfig') { if(!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) throw notConfigured('Supabase');return Response.json({supabaseUrl:process.env.SUPABASE_URL,supabaseAnonKey:process.env.SUPABASE_ANON_KEY}); }
      if(!publicFunctions.has(name)) await requireUser(request, name==='recoverStuckAutoBuilds');
      if(name==='twilioWebhook') await checkTwilio(request);
      if(name==='entitySchema') {const body=await request.json();return Response.json(runtime.schemas[body.name] || {});}
      const handler=runtime.handlers[name];if(!handler)return Response.json({error:'Unknown function'},{status:404});
      return await handler(request);
    }
    const integration=/^\/integrations\/([\w]+)$/.exec(path)?.[1];
    if(integration) { await requireUser(request);const method=createIntegrations(request).Core[integration];if(!method)throw new Error('Unknown integration');const payload=request.headers.get('Content-Type')?.includes('multipart/form-data')?{file:(await request.formData()).get('file')}:await request.json();return Response.json(await method(payload)); }
    const user=await requireUser(request);
    const body=await request.json();
    if(path==='/agents')return Response.json(await conversationAction(request,body));
    if(path==='/connections/connect')return Response.json(await connectAccount(request,body));
    if(path==='/connections/disconnect')return Response.json(await disconnectAccount(request,body));
    if(path==='/users/invite') {
      if(user.role!=='admin')throw Object.assign(new Error('Admin access required'),{status:403});
      if(!['user','admin'].includes(body.role) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || ''))throw new Error('Valid email and role required');
      const invited=await (await databaseRequest('/auth/v1/invite',{service:true,method:'POST',data:{email:body.email}})).json();
      if(body.role==='admin') await databaseRequest(`/rest/v1/profiles?id=eq.${invited.id}`,{service:true,method:'PATCH',data:{role:'admin'}});
      return Response.json({user:{id:invited.id,email:invited.email}});
    }
    return Response.json({error:'Not found'},{status:404});
  } catch(error) {console.error('Runtime request failed',error.message);return Response.json({error:error.message,code:error.code},{status:error.status || 500});}
  });
}
export async function nodeHandler(req,res) {
  const originHeader = req.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!allowedOrigins.length || allowedOrigins.includes(originHeader)) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.length ? originHeader : '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
  const origin=process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
  const request=new Request(new URL(req.url,origin),{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
  const response=await handleRequest(request);res.statusCode=response.status;response.headers.forEach((value,key)=>res.setHeader(key,value));res.end(Buffer.from(await response.arrayBuffer()));
}
export default nodeHandler;