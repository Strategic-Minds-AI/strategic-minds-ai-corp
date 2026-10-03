import { policySQL, quote, identifier } from './schemaPolicies.mjs';
import { readFile } from 'node:fs/promises';
export async function buildSchema(schemas,tables,entityJobs) {
  let sql=await readFile('src/deployment/runtimeSchema.sql','utf8');
  const seen=new Set();
  for(const [name,schema] of Object.entries(schemas)) {
    if(name==='User')continue;const table=tables[name];if(seen.has(table))continue;seen.add(table);
    sql+=`\ncreate table if not exists public.${identifier(table)} (id uuid primary key default gen_random_uuid());\n`;
    const builtins={created_date:{type:'string',format:'date-time',default:'now'},updated_date:{type:'string',format:'date-time',default:'now'},created_by_id:{type:'string',format:'uuid'},created_by:{type:'string'}};
    for(const [field,spec]of Object.entries({...builtins,...schema.properties})) {
      const type=spec.type==='number'?'numeric':spec.type==='integer'?'integer':spec.type==='boolean'?'boolean':['object','array'].includes(spec.type)?'jsonb':spec.format==='date-time'?'timestamptz':spec.format==='uuid'?'uuid':'text';
      const defaultSQL=spec.default===undefined?'':spec.default==='now'?' default now()':` default ${quote(typeof spec.default==='object'?JSON.stringify(spec.default):spec.default)}::${type}`;
      sql+=`alter table public.${identifier(table)} add column if not exists ${identifier(field)} ${type}${defaultSQL};\n`;
    }
    sql+=`alter table public.${identifier(table)} alter column created_by_id set default auth.uid();\nalter table public.${identifier(table)} alter column created_by set default (auth.jwt()->>'email');\nalter table public.${identifier(table)} enable row level security;\ndrop trigger if exists runtime_updated on public.${identifier(table)};\ncreate trigger runtime_updated before update on public.${identifier(table)} for each row execute function public.runtime_set_updated();\n`;
    for(const operation of ['read','create','update','delete']) {
      const rule=schema.rls?.[operation] ?? (['update','delete'].includes(operation)?schema.rls?.write ?? schema.rls?.read:undefined);
      const predicate=policySQL(rule,schema);const name=`runtime_${operation}`;const verb={read:'select',create:'insert',update:'update',delete:'delete'}[operation];
      sql+=`drop policy if exists ${name} on public.${identifier(table)};\ncreate policy ${name} on public.${identifier(table)} for ${verb} ${operation==='create'?`with check (${predicate})`:`using (${predicate})`}${operation==='update'?` with check (${predicate})`:''};\n`;
    }
    sql+=`grant select,insert,update,delete on public.${identifier(table)} to anon,authenticated;\n`;
  }
  for(const job of entityJobs) {
    const table=tables[job.entity_name];if(!table)throw new Error('Unknown workflow entity');
    const triggerName=`runtime_job_${job.name.replace(/\W/g,'_').toLowerCase()}`;
    const args=JSON.stringify(job.args || {});
    sql+=`\ndrop trigger if exists ${identifier(triggerName)} on public.${identifier(table)};\ncreate trigger ${identifier(triggerName)} after ${job.events.map(event=>event==='create'?'insert':event).join(' or ')} on public.${identifier(table)} for each row execute function public.runtime_enqueue_entity_job(${quote(job.function_name)},${quote(args)});\n`;
  }
  return sql;
}