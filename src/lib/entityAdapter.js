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
    const cols = options.fields ? options.fields.join(',') : '*';
    let dbQuery = supabase.from(table).select(cols);
    dbQuery = _applyFilters(dbQuery, query);

    if (options.sort) {
      const s = parseSort(options.sort);
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
    async filter(query, options = {}) {
      return _select(query, options);
    },

    async list(...args) {
      if (args.length > 0 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
        const opts = args[0];
        if (opts.distinct) {
          const supabase = await getSupabase();
          const { data, error } = await supabase.from(table).select(opts.distinct);
          if (error) throw new Error(error.message);
          const values = [...new Set((data || []).map(r => r[opts.distinct]).filter(v => v !== null))];
          return { items: values, next_cursor: null, has_more: false };
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
      const groupBy = options.groupBy;
      const page = await _select(options.query || {}, { limit: 1000, sort: options.sort });
      const rows = page.items;
      if (!groupBy) {
        const result = { count: rows.length };
        for (const field of options.sum || []) result[`sum_${field}`] = rows.reduce((a, r) => a + (Number(r[field]) || 0), 0);
        for (const field of options.avg || []) result[`avg_${field}`] = rows.length ? rows.reduce((a, r) => a + (Number(r[field]) || 0), 0) / rows.length : 0;
        return { rows: [result], truncated: false };
      }
      const groups = {};
      for (const r of rows) {
        const key = r[groupBy];
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      }
      const resultRows = Object.entries(groups).map(([key, items]) => {
        const row = { [groupBy]: key, count: items.length };
        for (const field of options.sum || []) row[`sum_${field}`] = items.reduce((a, r) => a + (Number(r[field]) || 0), 0);
        for (const field of options.avg || []) row[`avg_${field}`] = items.length ? items.reduce((a, r) => a + (Number(r[field]) || 0), 0) / items.length : 0;
        for (const field of options.min || []) row[`min_${field}`] = Math.min(...items.map(r => Number(r[field]) || 0));
        for (const field of options.max || []) row[`max_${field}`] = Math.max(...items.map(r => Number(r[field]) || 0));
        return row;
      });
      if (options.sort) {
        const s = parseSort(options.sort);
        resultRows.sort((a, b) => {
          const dir = s.ascending ? 1 : -1;
          return (a[s.column] || 0) > (b[s.column] || 0) ? dir : -dir;
        });
      }
      return { rows: resultRows, truncated: false };
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