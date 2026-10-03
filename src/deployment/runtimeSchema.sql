create extension if not exists pgcrypto;
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade,email text,full_name text default '',role text default 'user',created_at timestamptz default now(),updated_at timestamptz default now());
alter table public.profiles add column if not exists assistant_instructions text default '';
create table if not exists public.admin_role_grants(user_id uuid primary key references auth.users(id),granted_at timestamptz default now());
alter table public.admin_role_grants enable row level security;
create or replace function public.runtime_user_role() returns text language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() $$;
revoke all on function public.runtime_user_role() from public;
grant execute on function public.runtime_user_role() to anon,authenticated;
alter table public.profiles enable row level security;
drop policy if exists runtime_profiles_read on public.profiles;
create policy runtime_profiles_read on public.profiles for select using(id=auth.uid() or public.runtime_user_role()='admin');
drop policy if exists runtime_profiles_update on public.profiles;
create policy runtime_profiles_update on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
revoke update on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(full_name,assistant_instructions) on public.profiles to authenticated;
create or replace function public.runtime_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,email,full_name,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),case when exists(select 1 from public.admin_role_grants where user_id=new.id) then 'admin' else 'user' end) on conflict(id) do nothing;return new;end $$;
drop trigger if exists runtime_new_user on auth.users;
create trigger runtime_new_user after insert on auth.users for each row execute function public.runtime_new_user();
insert into public.profiles(id,email,full_name) select id,email,coalesce(raw_user_meta_data->>'full_name','') from auth.users on conflict(id) do nothing;
create or replace function public.runtime_set_updated() returns trigger language plpgsql as $$ begin new.updated_date=now();return new;end $$;
create table if not exists public.runtime_connections(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),connector_id text not null,provider text not null,encrypted_credentials text not null,connection_config jsonb default '{}',unique(owner_id,connector_id));
alter table public.runtime_connections enable row level security;
create table if not exists public.runtime_agent_conversations(id uuid primary key default gen_random_uuid(),created_by_id uuid not null references auth.users(id),agent_name text not null,metadata jsonb default '{}',messages jsonb default '[]',created_date timestamptz default now(),updated_date timestamptz default now());
alter table public.runtime_agent_conversations enable row level security;
create table if not exists public.runtime_jobs(id uuid primary key default gen_random_uuid(),dedupe_key text unique,function_name text not null,args jsonb default '{}',status text default 'pending',claimed_at timestamptz,completed_at timestamptz,result jsonb,error text,created_date timestamptz default now());
alter table public.runtime_jobs enable row level security;
create or replace function public.runtime_claim_jobs(batch_size integer default 3) returns setof public.runtime_jobs language plpgsql security definer set search_path=public as $$ begin return query update public.runtime_jobs set status='running',claimed_at=now() where id in(select id from public.runtime_jobs where status='pending' order by created_date for update skip locked limit least(batch_size,3)) returning *;end $$;
revoke all on function public.runtime_claim_jobs(integer) from public,anon,authenticated;
grant execute on function public.runtime_claim_jobs(integer) to service_role;
create or replace function public.runtime_enqueue_entity_job() returns trigger language plpgsql security definer set search_path=public as $$ declare arguments jsonb;record_id text;begin record_id:=case when tg_op='DELETE' then old.id::text else new.id::text end;arguments:=replace(tg_argv[1],'${ .trigger.entity_id }',record_id)::jsonb;insert into public.runtime_jobs(function_name,args) values(tg_argv[0],arguments);return coalesce(new,old);end $$;
insert into storage.buckets(id,name,public) values('private-files','private-files',false),('public-assets','public-assets',true) on conflict(id) do nothing;
create or replace function public.runtime_filter_sql(target_table text,query jsonb) returns text language plpgsql stable as $$ declare field text;value jsonb;op text;operand jsonb;parts text[]:=array[]::text[];nested text[];item jsonb;column_name text;expression text;begin
for field,value in select * from jsonb_each(coalesce(query,'{}')) loop
 if field in('$or','$and') then nested:=array[]::text[];for item in select * from jsonb_array_elements(value) loop nested:=array_append(nested,public.runtime_filter_sql(target_table,item));end loop;parts:=array_append(parts,'('||array_to_string(nested,case when field='$or' then ' or ' else ' and ' end)||')');continue;end if;
 column_name:=field;if not exists(select 1 from information_schema.columns where table_schema='public' and table_name=target_table and information_schema.columns.column_name=field) then raise exception 'Unknown query field %',field;end if;
 if jsonb_typeof(value)='object' then
  for op,operand in select * from jsonb_each(value) loop
   if op='$options' then continue;end if;
   if op in('$in','$nin') then expression:=format('%I::text %s (select jsonb_array_elements_text(%L::jsonb))',column_name,case when op='$in' then 'in' else 'not in' end,operand::text);
   elsif op='$exists' then expression:=format('%I is %s null',column_name,case when operand::boolean then 'not' else '' end);
   elsif op='$regex' then expression:=format('%I::text %s %L',column_name,case when coalesce(value->>'$options','') like '%i%' then '~*' else '~' end,operand#>>'{}');
   elsif op in('$eq','$ne','$gt','$gte','$lt','$lte') then expression:=format('%I %s %L',column_name,case op when '$eq' then '=' when '$ne' then '<>' when '$gt' then '>' when '$gte' then '>=' when '$lt' then '<' else '<=' end,operand#>>'{}');
   else raise exception 'Unsupported query operator %',op;end if;parts:=array_append(parts,expression);
  end loop;
 elsif value='null'::jsonb then parts:=array_append(parts,format('%I is null',column_name));
 else parts:=array_append(parts,format('%I::text=%L',column_name,value#>>'{}'));end if;
end loop;return coalesce(nullif(array_to_string(parts,' and '),''),'true');end $$;
create or replace function public.entity_aggregate(table_name text,options jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$ declare selects text[]:=array['count(*) as count'];group_columns text[]:=array[]::text[];field text;measure text;fields jsonb;group_field text;statement text;result jsonb;sort_field text;sort_direction text;maximum integer;begin
 if not exists(select 1 from information_schema.tables where table_schema='public' and information_schema.tables.table_name=entity_aggregate.table_name) or table_name in('runtime_connections','runtime_jobs','admin_role_grants') then raise exception 'Invalid aggregate table';end if;
 fields:=options->'groupBy';if jsonb_typeof(fields)='string' then fields:=jsonb_build_array(fields);end if;
 for group_field in select jsonb_array_elements_text(coalesce(fields,'[]')) loop if not exists(select 1 from information_schema.columns where table_schema='public' and information_schema.columns.table_name=entity_aggregate.table_name and column_name=group_field) then raise exception 'Unknown group field';end if;selects:=array_append(selects,format('%I',group_field));group_columns:=array_append(group_columns,format('%I',group_field));end loop;
 foreach measure in array array['sum','avg','min','max'] loop fields:=options->measure;if jsonb_typeof(fields)='string' then fields:=jsonb_build_array(fields);end if;for field in select jsonb_array_elements_text(coalesce(fields,'[]')) loop if not exists(select 1 from information_schema.columns where table_schema='public' and information_schema.columns.table_name=entity_aggregate.table_name and column_name=field) then raise exception 'Unknown measure field';end if;selects:=array_append(selects,format('%s(%I) as %I',measure,field,measure||'_'||field));end loop;end loop;
 maximum:=least(coalesce((options->>'limit')::integer,1000),1000);
 statement:=format('select %s from public.%I where %s%s',array_to_string(selects,','),table_name,public.runtime_filter_sql(table_name,options->'query'),case when array_length(group_columns,1)>0 then ' group by '||array_to_string(group_columns,',') else '' end);
 sort_field:=options->>'sort';if sort_field is not null then sort_direction:=case when left(sort_field,1)='-' then 'desc' else 'asc' end;sort_field:=ltrim(sort_field,'-');if sort_field !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' then raise exception 'Invalid sort';end if;statement:=statement||format(' order by %I %s',sort_field,sort_direction);end if;
 execute 'select jsonb_build_object(''rows'',coalesce(jsonb_agg(t),''[]''::jsonb),''truncated'',false) from ('||statement||' limit '||maximum||')t' into result;return result;end $$;
grant execute on function public.entity_aggregate(text,jsonb) to anon,authenticated;
create or replace function public.entity_distinct(table_name text,column_name text,conditions jsonb default '{}',page_limit integer default 50,page_offset integer default 0) returns jsonb language plpgsql security invoker set search_path=public as $$ declare result jsonb;total integer;begin
if not exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=entity_distinct.table_name and c.column_name=entity_distinct.column_name) or table_name in('runtime_connections','runtime_jobs','admin_role_grants') then raise exception 'Invalid distinct request';end if;
execute format('select coalesce(jsonb_agg(t.value),''[]''::jsonb) from (select distinct %I as value from public.%I where %s and %I is not null order by %I limit %s offset %s)t',column_name,table_name,public.runtime_filter_sql(table_name,conditions),column_name,column_name,least(page_limit,1000),greatest(page_offset,0)) into result;
return jsonb_build_object('items',result,'has_more',jsonb_array_length(result)=least(page_limit,1000),'next_cursor',case when jsonb_array_length(result)=least(page_limit,1000) then encode(convert_to((page_offset+page_limit)::text,'UTF8'),'base64') else null end);end $$;
grant execute on function public.entity_distinct(text,text,jsonb,integer,integer) to anon,authenticated;