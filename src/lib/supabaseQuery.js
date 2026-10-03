// Translates Base44/MongoDB-style query operators to PostgREST (Supabase) filters.
//
// Supported operators: $in, $nin, $gt, $gte, $lt, $lte, $ne, $exists, $or, $and, $regex
// Plain values become eq filters. Arrays become in filters. null becomes is.null.

function escapeValue(val) {
  if (val === null || val === undefined) return 'null';
  return String(val).replace(/,/g, '\\,').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildOperatorFilter(column, op, opVal) {
  switch (op) {
    case '$in':
      return `${column}=in.(${opVal.map(escapeValue).join(',')})`;
    case '$nin':
      return `${column}=not.in.(${opVal.map(escapeValue).join(',')})`;
    case '$gt':
      return `${column}=gt.${escapeValue(opVal)}`;
    case '$gte':
      return `${column}=gte.${escapeValue(opVal)}`;
    case '$lt':
      return `${column}=lt.${escapeValue(opVal)}`;
    case '$lte':
      return `${column}=lte.${escapeValue(opVal)}`;
    case '$ne':
      return `${column}=neq.${escapeValue(opVal)}`;
    case '$exists':
      return opVal ? `${column}=not.is.null` : `${column}=is.null`;
    case '$regex': {
      let pattern = String(opVal);
      const opts = typeof opVal === 'object' && opVal.$options ? opVal.$options : '';
      const caseInsensitive = opts.includes('i');
      pattern = pattern.replace(/^\^/, '').replace(/\$$/, '');
      pattern = pattern.replace(/\.\*/g, '%');
      if (!pattern.startsWith('%') && !String(opVal).startsWith('^')) pattern = '%' + pattern;
      if (!pattern.endsWith('%') && !String(opVal).endsWith('$')) pattern = pattern + '%';
      return caseInsensitive
        ? `${column}=ilike.${escapeValue(pattern)}`
        : `${column}=like.${escapeValue(pattern)}`;
    }
    default:
      return `${column}=eq.${escapeValue(opVal)}`;
  }
}

// Returns an array of PostgREST filter strings.
export function buildFilters(query) {
  const filters = [];
  if (!query || typeof query !== 'object') return filters;

  for (const [key, value] of Object.entries(query)) {
    if (key === '$or') {
      const parts = [];
      for (const sub of value) {
        parts.push(...buildFilters(sub));
      }
      if (parts.length) filters.push(`or=(${parts.map(part => part.replace('=', '.')).join(',')})`);
      continue;
    }
    if (key === '$and') {
      for (const part of value) filters.push(...buildFilters(part));
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) {
        if (op === '$options') continue;
        const filter = buildOperatorFilter(key, op, opVal);
        filters.push(op === '$regex' && value.$options?.includes('i') ? filter.replace('=like.', '=ilike.') : filter);
      }
    } else if (Array.isArray(value)) {
      filters.push(`${key}=in.(${value.map(escapeValue).join(',')})`);
    } else if (value === null) {
      filters.push(`${key}=is.null`);
    } else {
      filters.push(`${key}=eq.${escapeValue(value)}`);
    }
  }
  return filters;
}

// Parses filter strings into [column, operator, value] tuples for the Supabase JS client.
export function parseFilterStrings(filterStrings) {
  const results = [];
  for (const f of filterStrings) {
    if (f.startsWith('or=')) {
      const inner = f.slice(f.indexOf('(') + 1, f.lastIndexOf(')'));
      results.push(['__or__', 'or', inner]);
      continue;
    }
    const eqIdx = f.indexOf('=');
    const col = f.slice(0, eqIdx);
    const rest = f.slice(eqIdx + 1);
    const dotIdx = rest.indexOf('.');
    const op = dotIdx >= 0 ? rest.slice(0, dotIdx) : 'eq';
    const val = dotIdx >= 0 ? rest.slice(dotIdx + 1) : rest;
    results.push([col, op, val]);
  }
  return results;
}

// Parses a Base44 sort string ("-field" or "field") into Supabase order args.
export function parseSort(sort) {
  if (!sort) return null;
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  return { column, ascending: !desc };
}

// Encodes/decodes a cursor (offset-based for simplicity).
export function encodeCursor(offset) {
  return btoa(String(offset));
}
export function decodeCursor(cursor) {
  try {
    return parseInt(atob(cursor), 10) || 0;
  } catch {
    return 0;
  }
}