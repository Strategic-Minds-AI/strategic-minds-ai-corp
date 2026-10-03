import { runtime, invokeFunction, notConfigured } from './runtime.mjs';
import { databaseRequest } from './database.mjs';
import { trustRequest } from './context.mjs';
function matchesCron(expression, timezone, now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:timezone || 'UTC',minute:'numeric',hour:'numeric',hourCycle:'h23',day:'numeric',month:'numeric',weekday:'short'}).formatToParts(now).map(part=>[part.type,part.value]));
  const values = [Number(parts.minute),Number(parts.hour),Number(parts.day),Number(parts.month),['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday)];
  return expression.split(' ').every((field,index)=>field.split(',').some(part=> {if(part==='*') return true;if(part.startsWith('*/')) return values[index]%Number(part.slice(2))===0;if(part.includes('-')) {const [a,b]=part.split('-').map(Number);return values[index]>=a && values[index]<=b;}return values[index]===Number(part);}));
}
export async function tickJobs() {
  if (!process.env.JOB_OWNER_ID) throw notConfigured('JOB_OWNER_ID (existing approved admin)');
  const [user] = await (await databaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(process.env.JOB_OWNER_ID)}&limit=1`,{service:true})).json();
  if (user?.role !== 'admin') throw new Error('Scheduled job owner must be an existing approved admin');
  const now = new Date();
  await databaseRequest(`/rest/v1/runtime_jobs?status=eq.running&claimed_at=lt.${encodeURIComponent(new Date(Date.now()-15*60000).toISOString())}`,{service:true,method:'PATCH',data:{status:'failed',error:'Worker claim expired; manual review required before replaying side effects',completed_at:now.toISOString()}});
  for (const job of runtime.schedules || []) {
    const config=job.config;
    const interval = Number(config.interval_value)*(config.interval_unit==='days'?86400000:config.interval_unit==='hours'?3600000:60000);
    const due = config.schedule_mode==='interval' ? Math.floor(now.getTime()/60000) % (interval/60000)===0 : matchesCron(config.cron_expression,config.timezone,now);
    if (!due) continue;
    await databaseRequest('/rest/v1/runtime_jobs?on_conflict=dedupe_key',{service:true,method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},data:{dedupe_key:`${job.name}:${now.toISOString().slice(0,16)}`,function_name:job.function_name,args:job.args || {}}});
  }
  const jobs=await (await databaseRequest('/rest/v1/rpc/runtime_claim_jobs',{service:true,method:'POST',data:{batch_size:1}})).json();
  const results=[];
  for(const job of jobs) {
    const request=trustRequest(new Request('https://runtime.internal/jobs',{method:'POST',body:'{}'}),user);
    try { const result=await invokeFunction(job.function_name,job.args,request); if(result.data?.ok===false || result.data?.error) throw new Error(result.data.error || `Action reported failure: ${job.function_name}`); await databaseRequest(`/rest/v1/runtime_jobs?id=eq.${job.id}`,{service:true,method:'PATCH',data:{status:'succeeded',completed_at:new Date().toISOString(),result:result.data}}); results.push({id:job.id,status:'succeeded'}); }
    catch(error) { console.error('Scheduled action failed',job.function_name,error.message); await databaseRequest(`/rest/v1/runtime_jobs?id=eq.${job.id}`,{service:true,method:'PATCH',data:{status:'failed',completed_at:new Date().toISOString(),error:error.message}}); results.push({id:job.id,status:'failed'}); }
  }
  return {processed:results};
}
export function startScheduler() { let running=false; const tick=async()=>{if(running)return;running=true;try{await tickJobs();}catch(error){console.error(error.message);}finally{running=false;}}; const timer=setInterval(tick,60000);timer.unref();return ()=>clearInterval(timer); }