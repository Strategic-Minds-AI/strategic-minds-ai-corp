import { runtime, notConfigured } from './runtime.mjs';
import { tableName } from '../lib/entityTableMap.js';
import { buildFilters } from '../lib/supabaseQuery.js';
import { getSupabaseUser } from './auth.mjs';
export async function databaseRequest(path, { method = 'GET', data, request, service = false, headers = {} } = {}) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = service ? process.env.SUPABASE_SERVICE_KEY : process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw notConfigured('Supabase');
  const authorization = service ? `Bearer ${key}` : request?.headers.get('Authorization') || `Bearer ${key}`;
  const response = await fetch(`${url}${path}`, { method, headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json', ...headers }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
  if (!response.ok) { const error = await response.json(); throw Object.assign(new Error(error.message || 'Database operation failed'), { status: response.status }); }
  return response;
}
function queryString(query, options = {}) {
  const params = new URLSearchParams({ select: options.fields ? [...new Set(['id', ...options.fields])].join(',') : '*', limit: String(Math.min(options.limit || 50, 1000)) });
  for (const filter of buildFilters(query)) { const i = filter.indexOf('='); params.append(filter.slice(0, i), filter.slice(i + 1)); }
  const sort = options.sort || '-created_date'; params.set('order', `${sort.replace(/^-/, '')}.${sort.startsWith('-') ? 'desc' : 'asc'},id.asc`);
  if (options.cursor) params.set('offset', Buffer.from(options.cursor, 'base64').toString());
  return params;
}
export function entityAdapter(name, request, service = false) {
  const table = name === 'User' ? 'profiles' : runtime.tables[name] || tableName(name);
  const context = { request, service };
  const select = async (query = {}, options = {}) => {
    const params = queryString(query, { ...options, sort: name === 'User' ? options.sort?.replace('created_date','created_at') || '-created_at' : options.sort });
    const response = await databaseRequest(`/rest/v1/${table}?${params}`, context);
    const items = await response.json(); const limit = Number(params.get('limit')); const offset = Number(params.get('offset') || 0);
    return { items, has_more: items.length === limit, next_cursor: items.length === limit ? Buffer.from(String(offset + limit)).toString('base64') : null };
  };
  const mutate = async (method, data, query = {}) => {
    const params=queryString(query);params.delete('order');params.delete('limit');
    return (await databaseRequest(`/rest/v1/${table}?${params}`, { ...context, method, data, headers: { Prefer: 'return=representation' } })).json();
  };
  const stamp = async record => {
    const user = await getSupabaseUser(request); const schema = runtime.schemas[name] || {};
    const defaults = Object.fromEntries(Object.entries(schema.properties || {}).filter(([,value]) => value.default !== undefined).map(([key,value]) => [key,value.default]));
    return { ...defaults, ...record, ...(user ? { created_by_id: user.id, created_by: user.email } : {}) };
  };
  return {
    filter: async (query = {}, options, limit, offset) => typeof options === 'object' ? select(query, options) : (await select(query, { sort: options, limit, ...(offset ? {cursor:Buffer.from(String(offset)).toString('base64')} : {}) })).items,
    list: async (options, limit) => typeof options === 'object' ? select({}, options) : (await select({}, { sort: options, limit })).items,
    get: async id => (await select({ id }, { limit: 1 })).items[0] || null,
    create: async record => (await mutate('POST', await stamp(record)))[0],
    bulkCreate: async records => mutate('POST', await Promise.all(records.map(stamp))),
    update: async (id, patch) => (await mutate('PATCH', patch, { id }))[0],
    bulkUpdate: async records => Promise.all(records.map(({ id, ...patch }) => mutate('PATCH', patch, { id }).then(rows => rows[0]))),
    delete: async id => mutate('DELETE', undefined, { id }),
    deleteMany: async query => ({ deleted: (await mutate('DELETE', undefined, query)).length, has_more: false }),
    updateMany: async (query, update) => { if (Object.keys(update).some(key => key.startsWith('$') && key !== '$set')) throw new Error('Unsupported update operator'); return { updated: (await mutate('PATCH', update.$set || update, query)).length, has_more: false }; },
    count: async (query = {}) => {
      const params = queryString(query, { limit: 1, fields: ['id'] });
      const response = await databaseRequest(`/rest/v1/${table}?${params}`, { ...context, method: 'HEAD', headers: { Prefer: 'count=exact' } });
      return Number(response.headers.get('Content-Range')?.split('/')[1] || 0);
    },
    aggregate: async options => (await databaseRequest('/rest/v1/rpc/entity_aggregate', { ...context, method: 'POST', data: { table_name: table, options } })).json(),
    schema: async () => runtime.schemas[name] || {},
  };
}