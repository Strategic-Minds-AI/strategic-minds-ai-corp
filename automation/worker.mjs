import { readFile, writeFile, readdir, mkdir, appendFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const sha = value => createHash('sha256').update(value).digest('hex');
const GENESIS = '0'.repeat(64);
const MAX_MATERIALIZED_LINES = 120;
import { allowed } from './review-policy.mjs';
export { allowed } from './review-policy.mjs';

async function filesAt(dir) { const result = []; for (const item of await readdir(dir, { withFileTypes: true })) { const file = dir + '/' + item.name; if (item.isDirectory()) result.push(...await filesAt(file)); else if (item.isFile() && allowed(file)) result.push(file); } return result; }

function splitLines(content) {
  const lines = content.split('\n');
  if (content.endsWith('\n')) lines.pop();
  return { lines, trailing_newline: content.endsWith('\n') };
}

function validateLineIndependently(input) {
  const processResult = spawnSync(process.execPath, ['automation/line-validator.mjs', '--validate-line'], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    env: { PATH: process.env.PATH, NODE_NO_WARNINGS: '1' }
  });
  let result;
  try { result = JSON.parse(String(processResult.stdout || '').trim()); } catch { throw new Error('Independent line validator returned no parseable receipt.'); }
  if (processResult.status !== 0 || result?.passed !== true) throw new Error('Line validation blocked ' + input.path + ':' + input.line_number + ' [' + String(result?.code || 'VALIDATOR_FAILURE') + '].');
  return result;
}

async function materializeWithLineGate(change, cycleState) {
  const parsed = splitLines(change.content);
  if (!parsed.lines.length) throw new Error('Empty line set rejected.');
  if (cycleState.lines + parsed.lines.length > MAX_MATERIALIZED_LINES) throw new Error('Line-level validation budget exceeded; split the change into a smaller cycle.');
  cycleState.lines += parsed.lines.length;

  await mkdir('.line-stage', { recursive: true });
  const stagingPath = path.join('.line-stage', sha(change.path).slice(0, 24) + '.tmp');
  await rm(stagingPath, { force: true });

  let chain = GENESIS;
  const receipts = [];
  for (let index = 0; index < parsed.lines.length; index++) {
    const lineNumber = index + 1;
    const line = parsed.lines[index];
    const receipt = validateLineIndependently({ path: change.path, line_number: lineNumber, line, previous_chain: chain });
    const suffix = index < parsed.lines.length - 1 || parsed.trailing_newline ? '\n' : '';
    await appendFile(stagingPath, line + suffix, 'utf8');
    receipts.push(receipt);
    chain = receipt.chain_sha256;
  }

  const validated = await readFile(stagingPath, 'utf8');
  if (validated !== change.content || sha(validated) !== sha(change.content)) throw new Error('Line-gated materialization digest mismatch.');
  await mkdir(path.dirname(change.path), { recursive: true });
  await writeFile(change.path, validated, 'utf8');
  await rm(stagingPath, { force: true });
  return {
    path: change.path,
    file_sha256: sha(validated),
    final_chain_sha256: chain,
    trailing_newline: parsed.trailing_newline,
    lines: receipts
  };
}

async function generate() {
  const manifest = JSON.parse(await readFile('automation/manifest.json', 'utf8'));
  const criterion = manifest.criteria.find(item => item.id === process.env.CRITERION_ID);
  if (!criterion) throw new Error('Select a real benchmark criterion.');
  const all = (await filesAt('base44')).concat(await filesAt('src/components'), await filesAt('src/pages')).sort();
  const hints = criterion.id === 'agents.context' ? ['adminAssistant','useAdminChatSender','adminChatActions','AdminChatWorkspace'] : criterion.id.split('.').concat([criterion.domain]);
  const relevant = all.filter(file => hints.some(hint => file.toLowerCase().includes(hint.toLowerCase()))).slice(0, 6);
  if (!relevant.length) throw new Error('No scoped source context found; stop rather than guessing.');
  const context = []; let bytes = 0;
  for (const file of relevant) { const content = await readFile(file, 'utf8'); if (bytes + content.length > 24000) break; context.push({ path: file, sha256: sha(content), content }); bytes += content.length; }
  if (!context.length) throw new Error('Source context exceeds the bounded worker window.');

  const tagsResponse = await fetch('http://127.0.0.1:11434/api/tags');
  if (!tagsResponse.ok) throw new Error('Cannot verify local model identity.');
  const tags = await tagsResponse.json(); const localModel = tags.models?.find(item => item.name === 'qwen2.5-coder:1.5b');
  if (localModel?.digest?.replace(/^sha256:/, '') !== 'd7372fd828518a4d38b1eb196c673c31a85f2ed302b3d1e406c4c2d1b64a0668') throw new Error('Model digest changed; no candidate generated.');

  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5-coder:1.5b',
      stream: false,
      format: 'json',
      options: { temperature: 0, seed: 71, num_ctx: 8192, num_predict: 3000, num_thread: 2 },
      prompt: 'You are a bounded coding worker. Implement ONE small coherent part of this implementation brief. Never edit protected auth, security, approval, benchmark, test, automation or credential files. Preserve working functionality and imports. Return JSON only: {"summary":"...","changes":[{"path":"exact source path","before_sha256":"provided digest or NEW for new files","content":"complete file text"}],"blockers":[]}. At most 3 files, 120 materialized lines total and 20000 output characters. Every source line is independently validated by a separate trusted process before it may be materialized. A blocked line aborts the cycle. Do not invent tests, results, credentials or connectivity. If blocked return empty changes and explain the blocker. New files need to be imported by an existing changed source.\nBRIEF:\n' + criterion.prompt + '\nSOURCE:\n' + JSON.stringify(context)
    }),
    signal: AbortSignal.timeout(480000)
  });
  if (!response.ok) throw new Error('Local model request failed.');
  const model = await response.json();
  if (model.done !== true || model.done_reason === 'length') throw new Error('Incomplete model output is not a patch.');
  const proposal = JSON.parse(model.response);
  if (!Array.isArray(proposal.changes) || proposal.changes.length > 3 || JSON.stringify(proposal).length > 30000) throw new Error('Patch exceeded its bound.');

  const known = new Map(context.map(item => [item.path, item])); const seen = new Set(); const staged = [];
  for (const change of proposal.changes) {
    if (!allowed(change.path) || seen.has(change.path) || typeof change.content !== 'string' || !change.content.trim() || change.content.length > 20000) throw new Error('Unsafe patch target or invalid content.');
    if (/-----BEGIN .*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{20,}|sk_(?:live|proj)_[A-Za-z0-9_-]{16,}/.test(change.content)) throw new Error('Credential-like content rejected.');
    seen.add(change.path);
    const prior = known.get(change.path);
    if (prior) { if (change.before_sha256 !== prior.sha256 || sha(await readFile(change.path, 'utf8')) !== prior.sha256) throw new Error('Source precondition changed.'); }
    else { if (change.before_sha256 !== 'NEW' || all.includes(change.path)) throw new Error('Worker did not inspect this existing source.'); try { await readFile(change.path); throw new Error('New-file target already exists.'); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
    staged.push(change);
  }

  if (!staged.length) {
    await writeFile('automation-proposal.json', JSON.stringify({ status: 'BLOCKED', criterion_id: criterion.id, blockers: proposal.blockers || ['No bounded implementation produced.'], parity_awarded: 0 }, null, 2));
    throw new Error('No implementation produced; no success awarded.');
  }

  const cycleState = { lines: 0 };
  const lineFiles = [];
  try {
    for (const change of staged) lineFiles.push(await materializeWithLineGate(change, cycleState));
  } catch (error) {
    for (const change of staged) {
      const prior = known.get(change.path);
      if (prior) await writeFile(change.path, prior.content, 'utf8');
      else await rm(change.path, { force: true });
    }
    await rm('.line-stage', { recursive: true, force: true });
    throw error;
  }
  await rm('.line-stage', { recursive: true, force: true });

  const lineBundle = {
    schema_version: 1,
    contract: 'INDEPENDENT_LINE_GATE_V1',
    validator_process: 'separate_node_process',
    worker_self_certification_allowed: false,
    next_line_requires_previous_pass: true,
    source_sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    total_lines: cycleState.lines,
    files: lineFiles
  };
  await writeFile('automation-line-receipts.json', JSON.stringify(lineBundle, null, 2), 'utf8');

  const source = lineBundle.source_sha;
  const output = JSON.stringify({
    status: 'PROPOSED_NOT_VALIDATED',
    requires_security_review: true,
    line_gate_contract: lineBundle.contract,
    validated_materialized_lines: lineBundle.total_lines,
    criterion_id: criterion.id,
    source_sha: source,
    model_digest: localModel.digest,
    summary: String(proposal.summary || 'Bounded candidate change').slice(0, 1000),
    changes: staged.map(item => ({ path: item.path, sha256: sha(item.content) })),
    blockers: proposal.blockers || [],
    parity_awarded: 0
  }, null, 2);
  await writeFile('automation-proposal.json', output);
  console.log(JSON.stringify({ status: 'AWAITING_EXACT_CONTENT_SECURITY_REVIEW', proposal_sha256: sha(output), source_sha: source, publication_started: false, line_gate: lineBundle.contract, validated_lines: lineBundle.total_lines }));
}
if (process.argv.includes('--run')) await generate();