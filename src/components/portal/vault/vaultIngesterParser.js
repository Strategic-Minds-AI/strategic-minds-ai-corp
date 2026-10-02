// vaultIngesterParser.js
// Parses uploaded secret files (.env, JSON, CSV, TXT) into normalized vault entries.
// Each produced entry matches the vault's CredentialForm shape:
//   { title, provider, category, username, secret, url, notes }

const PROVIDER_HINTS = [
  { match: /stripe/i, provider: 'Stripe', category: 'api_key' },
  { match: /supabase/i, provider: 'Supabase', category: 'api_key' },
  { match: /twilio/i, provider: 'Twilio', category: 'api_key' },
  { match: /openai|gpt/i, provider: 'OpenAI', category: 'api_key' },
  { match: /google|gcp|gcs/i, provider: 'Google', category: 'api_key' },
  { match: /github/i, provider: 'GitHub', category: 'api_key' },
  { match: /railway/i, provider: 'Railway', category: 'api_key' },
  { match: /vercel/i, provider: 'Vercel', category: 'api_key' },
  { match: /godaddy/i, provider: 'GoDaddy', category: 'api_key' },
  { match: /aws|s3|iam/i, provider: 'AWS', category: 'api_key' },
  { match: /sendgrid|resend|mailgun|postmark/i, provider: 'Email', category: 'api_key' },
  { match: /slack/i, provider: 'Slack', category: 'api_key' },
  { match: /hubspot/i, provider: 'HubSpot', category: 'api_key' },
  { match: /vercel|netlify|cloudflare/i, provider: 'Hosting', category: 'api_key' },
  { match: /database|db_|postgres|mysql|mongo/i, provider: 'Database', category: 'api_key' },
];

const LOGIN_HINTS = /password|passwd|pwd|username|email|login|user_/i;
const NOTE_HINTS = /note|description|comment|remark/i;
const URL_HINTS = /url|endpoint|host|domain|webhook/i;

function clean(value) {
  if (value == null) return '';
  let v = String(value).trim();
  // strip surrounding quotes
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function titleCase(str) {
  return str.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function detectProviderCategory(key) {
  for (const hint of PROVIDER_HINTS) {
    if (hint.match.test(key)) return { provider: hint.provider, category: hint.category };
  }
  return { provider: '', category: LOGIN_HINTS.test(key) ? 'login' : 'api_key' };
}

function entryFromPair(key, value) {
  const cleanKey = clean(key);
  const cleanVal = clean(value);
  if (!cleanKey && !cleanVal) return null;
  const { provider, category } = detectProviderCategory(cleanKey);
  const isUrl = URL_HINTS.test(cleanKey) || /^https?:\/\//i.test(cleanVal);
  const isNote = NOTE_HINTS.test(cleanKey);
  return {
    title: titleCase(cleanKey) || 'Untitled item',
    provider,
    category: isNote ? 'note' : category,
    username: LOGIN_HINTS.test(cleanKey) && !/password|passwd|pwd|secret|token|key/i.test(cleanKey) ? cleanVal : '',
    secret: isUrl || isNote ? '' : cleanVal,
    url: isUrl ? cleanVal : '',
    notes: isNote ? cleanVal : '',
  };
}

function parseEnv(text) {
  const entries = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq);
    const value = line.slice(eq + 1);
    const entry = entryFromPair(key, value);
    if (entry) entries.push(entry);
  }
  return entries;
}

function parseJson(text) {
  const data = JSON.parse(text);
  const entries = [];
  const collect = (obj, prefix = '') => {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === 'object') entries.push(normalizeObject(item));
      }
    } else if (obj && typeof obj === 'object') {
      // If object looks like a single credential (has secret/password/token), normalize it
      const keys = Object.keys(obj);
      const hasSecret = keys.some(k => /secret|password|token|key|passwd|pwd/i.test(k));
      if (hasSecret && !keys.some(k => /secret|password|token|key/i.test(k) && typeof obj[k] === 'object')) {
        entries.push(normalizeObject(obj));
        return;
      }
      // Otherwise treat as key-value map
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}_${k}` : k;
        if (v && typeof v === 'object') collect(v, fullKey);
        else {
          const entry = entryFromPair(fullKey, v);
          if (entry) entries.push(entry);
        }
      }
    }
  };
  collect(data);
  return entries;
}

function normalizeObject(obj) {
  const get = (...names) => {
    for (const n of names) {
      for (const k of Object.keys(obj)) {
        if (k.toLowerCase() === n || k.toLowerCase().includes(n)) return clean(obj[k]);
      }
    }
    return '';
  };
  const title = get('title', 'name', 'service', 'label', 'item');
  const provider = get('provider', 'service', 'vendor', 'platform');
  const username = get('username', 'email', 'user', 'login', 'account');
  const secret = get('secret', 'password', 'token', 'key', 'passwd', 'pwd', 'api_key', 'apikey');
  const url = get('url', 'endpoint', 'host', 'webhook', 'site');
  const notes = get('notes', 'note', 'description', 'comment');
  const category = notes && !secret ? 'note' : (username && secret ? 'login' : 'api_key');
  const { provider: detProvider } = detectProviderCategory(`${title} ${provider} ${username}`);
  return {
    title: title || titleCase(Object.keys(obj).find(k => /name|title|service/i.test(k)) || 'Untitled item'),
    provider: provider || detProvider,
    category,
    username,
    secret,
    url,
    notes,
  };
}

function parseCsv(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  // simple CSV parser supporting quoted fields
  const parseLine = (line) => {
    const out = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(clean);
  };
  const headers = parseLine(lines[0]).map(h => h.toLowerCase());
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cells[idx] || ''; });
    rows.push(normalizeObject(obj));
  }
  return rows;
}

export function parseSecretFile(fileName, text) {
  const lower = (fileName || '').toLowerCase();
  let entries = [];
  let format = 'unknown';
  try {
    if (lower.endsWith('.json')) { format = 'json'; entries = parseJson(text); }
    else if (lower.endsWith('.csv')) { format = 'csv'; entries = parseCsv(text); }
    else { format = 'env'; entries = parseEnv(text); }
  } catch (err) {
    // fallback: try env parsing
    try { entries = parseEnv(text); format = 'env (fallback)'; }
    catch { throw new Error(`Could not parse file: ${err.message}`); }
  }
  // Deduplicate by title+provider+secret
  const seen = new Set();
  const cleaned = entries.filter(e => {
    const sig = `${e.title}|${e.provider}|${e.secret}`.toLowerCase();
    if (seen.has(sig)) return false;
    seen.add(sig);
    return e.title && (e.secret || e.url || e.notes || e.username);
  });
  return { format, count: cleaned.length, entries: cleaned };
}