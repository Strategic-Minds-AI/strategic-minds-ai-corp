export const sandboxSource = String.raw`import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const image = 'node:22.18.0-bookworm-slim@sha256:752ea8a2f758c34002a0461bd9f1cee4f9a3c36d48494586f60ffce1fc708e0e';
const tools = path.dirname(fileURLToPath(import.meta.url));
export function sandbox(command, extra = []) {
  return execFileSync('docker', ['run', '--rm', '--pull=never', '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--user=65534:65534', '--pids-limit=128', '--memory=3g', '--cpus=2', '--tmpfs=/work:rw,nosuid,nodev,size=1073741824,mode=1777', '--tmpfs=/tmp:rw,nosuid,nodev,size=67108864,mode=1777', '--mount', 'type=bind,src=' + path.resolve(process.env.CANDIDATE_DIRECTORY || 'candidate') + ',dst=/input,readonly', '--mount', 'type=bind,src=' + tools + ',dst=/trusted,readonly', '--mount', 'type=bind,src=' + path.resolve(tools, '../node_modules') + ',dst=/opt/node_modules,readonly', '--workdir=/work', image, ...extra, ...command], { encoding: 'utf8', timeout: 240000, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}
export function probe(name) { return JSON.parse(sandbox(['node', '--experimental-strip-types', '--loader', '/trusted/runtime-loader.mjs', '/trusted/probe.mjs', name])); }
if (process.argv.includes('--isolation-check')) {
  const result = probe('isolation');
  if (!result.trusted_read_only || !result.source_read_only || !result.network_blocked || !result.credentials_absent || !result.socket_absent || !result.report_absent) throw new Error('Sandbox isolation checks failed.');
  console.log('Read-only mounts, network denial, absent credentials/socket/report verified.');
}
if (process.argv.includes('--compile')) {
  sandbox(['sh', '-c', 'mkdir -p /work/app && cp -R /input/. /work/app/ && rm -rf /work/app/node_modules && mkdir /work/app/node_modules && for package in /opt/node_modules/* /opt/node_modules/.[!.]*; do if [ -e "$package" ]; then ln -s "$package" /work/app/node_modules/; fi; done && cd /work/app && node /opt/node_modules/vite/bin/vite.js build --outDir /work/dist']);
  console.log('Candidate frontend compiled in a network-disabled container.');
}
`;
export const probeSource = String.raw`import { writeFile, access } from 'node:fs/promises';
const load = file => import('file:///input/base44/shared/' + file + '.ts');
const rejected = async operation => { try { await operation(); return false; } catch { return true; } };
const name = process.argv[2]; let result;
if (name === 'isolation') {
  result = { trusted_read_only: await rejected(() => writeFile('/trusted/.write-probe', 'denied')), source_read_only: await rejected(() => writeFile('/input/.write-probe', 'denied')), network_blocked: await rejected(() => fetch('https://example.com', { signal: AbortSignal.timeout(2000) })), credentials_absent: !Object.keys(process.env).some(key => /TOKEN|SECRET|GITHUB|ACTIONS_|BASE44|AI_GATEWAY/.test(key)), socket_absent: await rejected(() => access('/var/run/docker.sock')), report_absent: await rejected(() => access('/benchmark-ci-report.json')) };
} else if (name === 'messages') {
  const { chatMessage, chatKey, pageOffset } = await load('adminChatValidation');
  result = { unknown: await rejected(() => chatMessage({ role: 'user', content: 'hello', owner_id: 'other' }, 'user')), oversized: await rejected(() => chatMessage({ role: 'user', content: 'x'.repeat(60001) }, 'user')), traversal: await rejected(() => chatKey('../other')), negative: await rejected(() => pageOffset(-1)), fraction: await rejected(() => pageOffset(1.5)), zero: pageOffset(0), normalized: chatMessage({ role: 'user', content: 'hello', attachments: null }, 'user'), canonical: chatMessage({ role: 'user', content: 'hello' }, 'user'), unsafe_url: await rejected(() => chatMessage({ role: 'assistant', content: 'hello', savedUrl: 'http://unsafe.test' }, 'assistant')) };
} else if (name === 'chat') {
  const { beginTurn, finishTurn } = await load('adminChatTurns'); const { deleteConversations } = await load('adminChatConversations');
  let sequence = 0; const records = { AdminConversation: [], AdminChatTurn: [] };
  const matches = (row, query) => Object.entries(query).every(([key, value]) => value && typeof value === 'object' ? ('$in' in value ? value.$in.includes(row[key]) : '$lte' in value ? row[key] <= value.$lte : false) : row[key] === value);
  const api = { entities: Object.fromEntries(Object.keys(records).map(name => [name, {
    async filter(query, sort, limit, skip = 0) { return structuredClone(records[name].filter(row => matches(row, query)).slice(skip, skip + limit)); },
    async create(data) { const row = { ...structuredClone(data), id: String(++sequence), created_date: new Date().toISOString() }; records[name].push(row); return structuredClone(row); },
    async update(id, data) { const row = records[name].find(row => row.id === id); Object.assign(row, structuredClone(data)); return structuredClone(row); },
    async updateMany(query, changes) { const rows = records[name].filter(row => matches(row, query)); for (const row of rows) { Object.assign(row, structuredClone(changes.$set || {})); for (const [key, value] of Object.entries(changes.$max || {})) if (!row[key] || row[key] < value) row[key] = value; } return { updated: rows.length, has_more: false }; },
    async deleteMany(query) { records[name] = records[name].filter(row => !matches(row, query)); return { deleted: true }; }
  }])) };
  const input = { chatKey: 'fixture_chat_one', turnKey: 'fixture_turn_one', title: 'Fixture', userMessage: { role: 'user', content: 'hello' } };
  const first = await beginTurn(api, 'owner-one', input); const retry = await beginTurn(api, 'owner-one', input);
  const conflict = await beginTurn(api, 'owner-one', { ...input, userMessage: { role: 'user', content: 'different' } });
  await finishTurn(api, 'owner-one', { ...input, assistantMessage: { role: 'assistant', content: 'result', savedUrl: 'https://drive.google.com/fixture' } });
  await finishTurn(api, 'owner-one', { ...input, assistantMessage: { role: 'assistant', content: 'result' } });
  const saved = records.AdminChatTurn[0].assistant_message.savedUrl;
  const overwrite = await finishTurn(api, 'owner-one', { ...input, assistantMessage: { role: 'assistant', content: 'overwrite' } });
  await finishTurn(api, 'owner-one', input, true); const status = records.AdminChatTurn[0].status;
  const other = await finishTurn(api, 'other-owner', input);
  await deleteConversations(api, 'owner-one', input.chatKey);
  result = { same_id: first.turn.id === retry.turn.id, conflict: conflict.status, saved, overwrite: overwrite.status, status, other: other.status, remaining: records.AdminChatTurn.length, tombstone: (await beginTurn(api, 'owner-one', input)).status, skipped: (await beginTurn(api, 'owner-one', input, true)).skipped };
} else { throw new Error('Unknown trusted probe.'); }
process.stdout.write(JSON.stringify(result));
`;