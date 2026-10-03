import { createServer } from 'node:http';
import { nodeHandler } from './handler.mjs';
import { startScheduler } from './jobs.mjs';
const allowed=(process.env.ALLOWED_ORIGINS || process.env.APP_URL || '').split(',').filter(Boolean);
createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin && allowed.includes(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
  if(req.method==='OPTIONS'){res.statusCode=204;res.end();return;}
  try{await nodeHandler(req,res);}catch(error){console.error(error.message);res.statusCode=500;res.end(JSON.stringify({error:'Runtime request failed'}));}
}).listen(process.env.PORT || 3000,()=>console.log('Strategic Minds owned runtime started'));
if(process.env.ENABLE_SCHEDULER==='true')startScheduler();