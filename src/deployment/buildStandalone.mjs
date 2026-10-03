// Produces a self-contained deployment; source compatibility names are not runtime dependencies.
import { readdir, readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { build } from 'esbuild';
import { tableName } from '../lib/entityTableMap.js';
import { buildSchema } from './schemaBuilder.mjs';
import { auditStandalone } from './auditStandalone.mjs';
import { exportOwnedSource } from './exportOwnedSource.mjs';
import { archiveOwnedRelease } from './archiveOwnedRelease.mjs';
const root=process.cwd();const output=resolve(root,'.standalone');await mkdir(resolve(output,'api'),{recursive:true});
const backendSource=await readdir('backend').then(()=>'backend').catch(error=>{if(error.code==='ENOENT')return 'base44';throw error;});
const schemas={};const tables={};
for(const file of await readdir(`${backendSource}/entities`)) {if(!file.endsWith('.jsonc'))continue;const schema=JSON.parse(await readFile(`${backendSource}/entities/${file}`,'utf8'));schemas[schema.name]=schema;tables[schema.name]=tableName(schema.name);}
const generatorExtras={generator_key:{type:'string'},steps_json:{type:'string'},artifacts_json:{type:'string'}};
if(schemas.GeneratorRun)Object.assign(schemas.GeneratorRun.properties,generatorExtras);
const agents={};for(const file of await readdir(`${backendSource}/agents`))if(file.endsWith('.jsonc'))agents[file.slice(0,-6)]=JSON.parse(await readFile(`${backendSource}/agents/${file}`,'utf8'));
const functions=(await readdir(`${backendSource}/functions`)).sort();const schedules=[];const entityJobs=[];
const active=new Set(['Autonomous Build Loop','AutoBuild Recovery','CRM Scheduled Follow-ups','Daily Encrypted Vault Backup','Lead to CRM Sync','Sitemap on Post Publish','Sitemap on Project Publish']);
for(const file of await readdir(`${backendSource}/workflows`)) {
  const flow=JSON.parse(await readFile(`${backendSource}/workflows/${file}`,'utf8'));if(!active.has(flow.name))continue;
  if(flow.trigger.condition)throw new Error(`Workflow condition needs explicit migration: ${flow.name}`);
  const steps=flow.definition.do;if(steps.length!==1)throw new Error(`Workflow needs explicit migration: ${flow.name}`);
  const step=Object.values(steps[0])[0];if(step.call!=='invoke_backend_function' || step.then!=='end')throw new Error(`Unsupported workflow: ${flow.name}`);
  const job={name:flow.name,...step.with,config:flow.trigger.config};if(job.config.trigger_type==='scheduled')schedules.push(job);else entityJobs.push({...job,...job.config});
}
const registry=`import ${JSON.stringify(resolve(root,'src/server/client.mjs'))};\n`+functions.map((name,index)=>`import f${index} from ${JSON.stringify(resolve(root,`${backendSource}/functions/${name}/entry.ts`))};`).join('\n')+`\nimport {configureRuntime} from ${JSON.stringify(resolve(root,'src/server/runtime.mjs'))};\nconfigureRuntime(${JSON.stringify({schemas,tables,agents,schedules}).slice(0,-1)},handlers:{${functions.map((name,index)=>`${JSON.stringify(name)}:f${index}`).join(',')}}});`;
const plugin={name:'owned-runtime',setup(bundler){
  bundler.onResolve({filter:/registry\.mjs$/},()=>({path:'registry',namespace:'generated'}));
  bundler.onLoad({filter:/.*/,namespace:'generated'},()=>({contents:registry,loader:'js',resolveDir:root}));
  bundler.onResolve({filter:/^(npm:)?@base44\/sdk/},()=>{throw new Error('Forbidden platform SDK import');});
  bundler.onResolve({filter:/shared\/ownedClient\.ts$/},()=>({path:resolve(root,'src/server/client.mjs')}));
  bundler.onResolve({filter:/^base44:runtime$/},()=>{throw new Error('Forbidden platform runtime import');});
  bundler.onResolve({filter:/shared\/aiGateway\.ts$/},()=>({path:resolve(root,'src/server/gateway.mjs')}));
  bundler.onResolve({filter:/shared\/supabaseAuth\.ts$/},()=>({path:resolve(root,'src/server/auth.mjs')}));
  bundler.onResolve({filter:/^npm:/},args=>({path:args.path.replace(/^npm:/,'').replace(/@\d[^/]*/,''),external:true}));
}};
const options={bundle:true,platform:'node',format:'esm',target:'node22',plugins:[plugin],minify:true,legalComments:'none',metafile:true};
const server=await build({...options,entryPoints:['src/server/start.mjs'],outfile:resolve(output,'server.mjs')});
const api=await build({...options,entryPoints:['src/server/handler.mjs'],outfile:resolve(output,'api/runtime.mjs')});
for(const result of [server,api])for(const file of Object.keys(result.metafile.inputs))if(file.includes('node_modules/@base44/'))throw new Error('Forbidden platform dependency in standalone build');
const pkg={name:'strategic-minds-owned-runtime',private:true,type:'module',engines:{node:'22.x'},scripts:{start:'node server.mjs'},dependencies:{stripe:'^17.7.0',jose:'^6.1.0',nodemailer:'^6.9.16'}};
await writeFile(resolve(output,'package.json'),JSON.stringify(pkg,null,2));
await writeFile(resolve(output,'schema.sql'),await buildSchema(schemas,tables,entityJobs));
await writeFile(resolve(output,'vercel.json'),JSON.stringify({version:2,buildCommand:'',outputDirectory:'dist',functions:{'api/runtime.mjs':{maxDuration:800}},rewrites:[{source:'/api/runtime/:path*',destination:'/api/runtime?route=:path*'},{source:'/((?!api/|assets/).*)',destination:'/index.html'}],crons:[{path:'/api/runtime/jobs/tick',schedule:'*/5 * * * *'}]},null,2));
await cp('src/deployment/standalone.env.example',resolve(output,'.env.example'));
await cp('src/deployment/STANDALONE.md',resolve(output,'README.md'));
await mkdir(resolve(output,'workers'),{recursive:true});
await cp(`${backendSource}/shared/sandbox/railwayWorker.js`,resolve(output,'workers/railwayWorker.js'));
for(const file of ['server.mjs','api/runtime.mjs']) {
  const text=await readFile(resolve(output,file),'utf8');
  if(/(?:from\s*|import\s*\()["'](?:@base44\/|base44:runtime)/.test(text))throw new Error('Forbidden platform runtime dependency');
}
const audit=await auditStandalone(output,[server,api]);
const source=await exportOwnedSource(output,backendSource);
await writeFile(resolve(output,'dependency-audit.json'),JSON.stringify({...audit,source,functions:functions.length,agents:Object.keys(agents).length,entities:Object.keys(schemas).length,schedules:schedules.map(job=>job.name),entityWorkflows:entityJobs.map(job=>job.name),gateway:'https://ai-gateway.vercel.sh/v1',runtimeDependencies:pkg.dependencies},null,2));
const archive=await archiveOwnedRelease(output);
console.log(`Independent release and editable source built: ${functions.length} functions, ${Object.keys(schemas).length} entities; zero platform SDK, runtime, hosted URLs or source build dependencies. Archive: ${archive}`);