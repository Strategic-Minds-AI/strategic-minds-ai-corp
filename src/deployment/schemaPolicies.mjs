const quote=value=>`'${String(value).replace(/'/g,"''")}'`;
const identifier=value=>`"${String(value).replace(/"/g,'""')}"`;
function sqlValue(value) {
  if(value==='{{user.id}}')return 'auth.uid()::text';
  if(value==='{{user.email}}')return "(auth.jwt()->>'email')";
  if(value==='{{user.role}}')return "public.runtime_user_role()";
  const field=/^\{\{user\.data\.(\w+)\}\}$/.exec(value);
  if(field)return `(select to_jsonb(p)->>${quote(field[1])} from public.profiles p where p.id=auth.uid())`;
  if(value===null)return 'null';return quote(value);
}
export function policySQL(rule,schema) {
  if(rule===false)return 'false';if(rule===true || !rule || Object.keys(rule).length===0)return 'true';
  if(rule.$or)return '('+rule.$or.map(item=>policySQL(item,schema)).join(' or ')+')';
  if(rule.$and)return '('+rule.$and.map(item=>policySQL(item,schema)).join(' and ')+')';
  if(rule.$nor)return 'not ('+rule.$nor.map(item=>policySQL(item,schema)).join(' or ')+')';
  if(rule.user_condition)return Object.entries(rule.user_condition).map(([field,value])=>field==='role'?`public.runtime_user_role()=${quote(value)}`:field==='id'?`auth.uid()::text=${quote(value)}`:`(auth.jwt()->>${quote(field)})=${quote(value)}`).join(' and ');
  return Object.entries(rule).map(([key,value])=>{
    const field=key.replace(/^data\./,'');const col=identifier(field);const array=schema.properties?.[field]?.type==='array';
    if(field.includes('.')) {
      const [root,...segments]=field.split('.');
      let spec=schema.properties?.[root];
      if(!spec || typeof value==='object')throw new Error(`Unsupported nested policy: ${field}`);
      let path='$';
      for(const segment of segments) {
        if(spec.type==='array'){path+='[*]';spec=spec.items;}
        spec=spec.properties?.[segment];
        if(!spec)throw new Error(`Unknown nested policy field: ${field}`);
        path+='.'+JSON.stringify(segment);
      }
      return `exists(select 1 from jsonb_path_query(${identifier(root)},${quote(path)}::jsonpath) as nested(value) where nested.value#>>'{}'=${sqlValue(value)})`;
    }
    if(value===null)return `${col} is null`;
    if(typeof value!=='object')return array?`${col} ? ${sqlValue(value)}`:`${col}::text=${sqlValue(value)}`;
    return Object.entries(value).map(([op,operand])=>{
      if(op==='$exists')return `${col} is ${operand?'not ':''}null`;
      if(op==='$in' || op==='$nin'){if(!Array.isArray(operand))throw new Error(`Unsupported dynamic membership policy: ${field}`);const values=operand.map(sqlValue).join(',');const expression=array?`exists(select 1 from jsonb_array_elements_text(${col}) as member where member in (${values}))`:`${col}::text in (${values})`;return op==='$nin'?`not (${expression})`:expression;}
      const operators={$eq:'=',$ne:'<>',$gt:'>',$gte:'>=',$lt:'<',$lte:'<='};if(!operators[op])throw new Error(`Unsupported policy operator ${op}`);return `${col}::text ${operators[op]} ${sqlValue(operand)}`;
    }).join(' and ');
  }).join(' and ');
}
export {quote,identifier};