import { entityAdapter } from './database.mjs';
import { invokeFunction } from './runtime.mjs';
export function configuredTools(agent,request) {
  const executors=new Map();const tools=[];
  const add=(name,description,parameters,execute)=>{executors.set(name,execute);tools.push({type:'function',function:{name,description,parameters}});};
  for(const config of agent.tool_configs || []) {
    if(config.function_name) add(`function_${config.function_name.replace(/\W/g,'_')}`,config.description || `Call ${config.function_name}`,{type:'object',properties:{payload:{type:'object',additionalProperties:true}},required:['payload']},async args=>(await invokeFunction(config.function_name,args.payload,request)).data);
    if(config.entity_name)for(const operation of config.allowed_operations || []) {
      const entity=entityAdapter(config.entity_name,request,false);
      add(`${operation}_${config.entity_name}`,`${operation} records in ${config.entity_name}; permissions remain enforced by the database.`,{type:'object',properties:{id:{type:'string'},query:{type:'object',additionalProperties:true},data:{type:'object',additionalProperties:true},limit:{type:'integer',minimum:1,maximum:50}}},async args=>{
        if(operation==='read')return args.id?entity.get(args.id):entity.filter(args.query || {},{limit:Math.min(args.limit || 20,50)});
        if(operation==='create')return entity.create(args.data || {});
        if(!args.id)throw new Error('Record ID is required');
        if(operation==='update')return entity.update(args.id,args.data || {});
        if(operation==='delete'){await entity.delete(args.id);return {deleted:true};}
        throw new Error('Unapproved operation');
      });
    }
  }
  return {tools,execute:async call=>{const execute=executors.get(call.function.name);if(!execute)throw new Error('Unapproved agent tool');return execute(JSON.parse(call.function.arguments || '{}'));}};
}