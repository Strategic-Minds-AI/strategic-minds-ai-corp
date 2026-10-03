// Drop-in replacement for base44.entities.<Name> — backed by Supabase.
// Mirrors the full Base44 entity API: filter, list, get, create, update,
// delete, count, aggregate, bulkCreate, updateMany, deleteMany, upsert,
// subscribe.

import { getSupabase } from './supabaseClient';
import { tableName } from './entityTableMap';
import { buildFilters, parseFilterStrings, parseSort, encodeCursor, decodeCursor } from './supabaseQuery';

function entityAdapter(entityName) {
  const table = tableName(entityName);

  function _applyFilters(dbQuery, query) {
    for (const [col, op, val] of parseFilterStrings(buildFilters(query))) {
      if (col === '__or__') {
        dbQuery = dbQuery.or(val);
      } else {
        dbQuery = dbQuery.filter(col, op, val);
      }
    }
    return dbQuery;
  }

  async function _select(query, options = {}) {
    const supabase = await getSupabase();
    const cols = options.fields ? [...new Set(['id', ...options.fields.map(f => f === 'created_date' ? 'created_at' : f)])].join(',') : '*';
    let dbQuery = supabase.from(table).select(cols);
    dbQuery = _applyFilters(dbQuery, query);

    if (options.sort) {
      const s = parseSort(options.sort.replace('created_date', 'created_at'));
      if (s) dbQuery = dbQuery.order(s.column, { ascending: s.ascending });
    }

    const limit = options.limit || 50;
    dbQuery = dbQuery.limit(limit);

    if (options.cursor) {
      const offset = decodeCursor(options.cursor);
      dbQuery = dbQuery.range(offset, offset + limit - 1);
    }

    const { data, error } = await dbQuery;
    if (error) throw new Error(error.message);
    const offset = options.cursor ? decodeCursor(options.cursor) : 0;
    return {
      items: data || [],
      next_cursor: data && data.length === limit ? encodeCursor(offset + limit) : null,
      has_more: data ? data.length === limit : false,
    };
  }

  return {
    async filter(query, options, limit) {
      if (options?.distinct) {
        const supabase = await getSupabase();
        const { data, error } = await supabase.rpc('entity_distinct', { table_name: table, column_name: options.distinct, conditions: query || {}, page_limit: options.limit || 50, page_offset: options.cursor ? decodeCursor(options.cursor) : 0 });
        if (error) throw new Error(error.message);
        return data;
      }
      if (options && typeof options === 'object') return _select(query, options);
      return (await _select(query, { sort: options, limit: limit || 50 })).items;
    },

    async list(...args) {
      if (args.length > 0 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
        const opts = args[0];
        if (opts.distinct) {
          const supabase = await getSupabase();
          const { data, error } = await supabase.rpc('entity_distinct', { table_name: table, column_name: opts.distinct, conditions: {}, page_limit: opts.limit || 50, page_offset: opts.cursor ? decodeCursor(opts.cursor) : 0 });
          if (error) throw new Error(error.message);
          return data;
        }
        return _select({}, opts);
      }
      // Legacy: list(sort, limit)
      const sort = args[0] || '-created_date';
      const limit = typeof args[1] === 'number' ? args[1] : 50;
      const page = await _select({}, { sort, limit });
      return page.items;
    },

    async get(id) {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },

    async create(record) {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from(table).insert(record).select('*').single();
      if (error) throw new Error(error.message);
      return data;
    },

    async bulkCreate(records) {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from(table).insert(records).select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },

    async update(id, patch) {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from(table).update(patch).eq('id', id).select('*').single();
      if (error) throw new Error(error.message);
      return data;
    },

    async bulkUpdate(records) {
      const supabase = await getSupabase();
      const results = [];
      for (const r of records) {
        const { id, ...patch } = r;
        const { data, error } = await supabase.from(table).update(patch).eq('id', id).select('*').single();
        if (error) throw new Error(error.message);
        results.push(data);
      }
      return results;
    },

    async updateMany(query, update) {
      const supabase = await getSupabase();
      const patch = update.$set || update;
      let dbQuery = supabase.from(table).update(patch);
      dbQuery = _applyFilters(dbQuery, query);
      const { data, error } = await dbQuery.select('*');
      if (error) throw new Error(error.message);
      return { updated: data?.length || 0, has_more: false };
    },

    async delete(id) {
      const supabase = await getSupabase();
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
    },

    async deleteMany(query) {
      const supabase = await getSupabase();
      let dbQuery = supabase.from(table).delete();
      dbQuery = _applyFilters(dbQuery, query);
      const { data, error } = await dbQuery.select('id');
      if (error) throw new Error(error.message);
      return { deleted: data?.length || 0, has_more: false };
    },

    async count(query) {
      const supabase = await getSupabase();
      let dbQuery = supabase.from(table).select('*', { count: 'exact', head: true });
      dbQuery = _applyFilters(dbQuery, query);
      const { count, error } = await dbQuery;
      if (error) throw new Error(error.message);
      return count || 0;
    },

    async aggregate(options) {
      const supabase = await getSupabase();
      const { data, error } = await supabase.rpc('entity_aggregate', { table_name: table, options });
      if (error) throw new Error(error.message);
      return data;
    },
    async schema() {
      const { functions } = await import('@/lib/functionClient');
      return (await functions.invoke('entitySchema', { name: entityName })).data;
    },

    async upsert(records, opts = {}) {
      const supabase = await getSupabase();
      const key = opts.key || 'id';
      const { data, error } = await supabase.from(table).upsert(records, { onConflict: key }).select('*');
      if (error) throw new Error(error.message);
      return { created: data?.length || 0, updated: 0, records: data || [] };
    },

    subscribe(callback) {
      let unsub = () => {};
      (async () => {
        const supabase = await getSupabase();
        const channel = supabase
          .channel(`${table}_changes`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
            const eventType = payload.eventType === 'INSERT' ? 'create' :
              payload.eventType === 'UPDATE' ? 'update' : 'delete';
            callback({ id: payload.new?.id || payload.old?.id, type: eventType, data: payload.new || payload.old });
          })
          .subscribe();
        unsub = () => supabase.removeChannel(channel);
      })();
      return unsub;
    },
  };
}

export { entityAdapter };