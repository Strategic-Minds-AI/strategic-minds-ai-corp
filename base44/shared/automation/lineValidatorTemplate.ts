export const lineValidatorSource = String.raw`import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const GENESIS = '0'.repeat(64);
const allowedPath = file => typeof file === 'string' &&
  /^(src\/(components|pages)\/|base44\/(shared|functions)\/)[A-Za-z0-9_./-]+\.(jsx?|tsx?)$/.test(file) &&
  !file.split('/').some(part => part === '..' || part === '.' || part === '') &&
  !/(^|\/)(automation|\.github|entities|agents|workflows|connectors|api|lib)(\/|$)|benchmark|vault|Auth|Login|Register|Password|ProtectedRoute|package|lock|\.env/i.test(file);

const credentialPattern = /-----BEGIN .*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{20,}|sk_(?:live|proj)_[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}/;
const protectedSemanticPattern = /\b(?:SUPABASE_SERVICE_ROLE_KEY|VERCEL_TOKEN|CRON_SECRET|ZERO_BOOTSTRAP_TOKEN|service_role|SECURITY\s+DEFINER|process\.env|child_process|execFile|spawn|eval\s*\(|new\s+Function\s*\(|dangerouslySetInnerHTML)\b/i;

export function splitLines(content) {
  if (typeof content !== 'string') throw new Error('Content must be text.');
  const lines = content.split('\n');
  if (content.endsWith('\n')) lines.pop();
  return { lines, trailing_newline: content.endsWith('\n') };
}

export function validateLine(input) {
  const result = { passed: false, code: 'INVALID_LINE' };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  const file = input.path;
  const lineNumber = Number(input.line_number);
  const line = input.line;
  const previousChain = input.previous_chain || GENESIS;
  if (!allowedPath(file)) return { ...result, code: 'PATH_NOT_ALLOWED' };
  if (!Number.isInteger(lineNumber) || lineNumber < 1) return { ...result, code: 'INVALID_LINE_NUMBER' };
  if (typeof line !== 'string') return { ...result, code: 'LINE_NOT_TEXT' };
  if (!/^[a-f0-9]{64}$/.test(previousChain)) return { ...result, code: 'INVALID_PREVIOUS_CHAIN' };
  if (Buffer.byteLength(line, 'utf8') > 4096) return { ...result, code: 'LINE_TOO_LARGE' };
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(line)) return { ...result, code: 'CONTROL_CHARACTER' };
  if (credentialPattern.test(line)) return { ...result, code: 'CREDENTIAL_LIKE_CONTENT' };
  if (protectedSemanticPattern.test(line)) return { ...result, code: 'PROTECTED_SEMANTIC_REVIEW_REQUIRED' };
  const lineSha = sha256(line);
  const chainSha = sha256(previousChain + '\n' + file + '\n' + lineNumber + '\n' + lineSha);
  return { passed: true, code: 'PASS', path: file, line_number: lineNumber, line_sha256: lineSha, previous_chain: previousChain, chain_sha256: chainSha };
}

export async function verifyReceiptBundle(root, receiptPath) {
  const bundle = JSON.parse(await readFile(receiptPath, 'utf8'));
  if (bundle?.schema_version !== 1 || bundle?.contract !== 'INDEPENDENT_LINE_GATE_V1' || !Array.isArray(bundle.files) || !bundle.files.length) throw new Error('Invalid line receipt bundle.');
  let total = 0;
  for (const fileReceipt of bundle.files) {
    if (!allowedPath(fileReceipt.path) || !Array.isArray(fileReceipt.lines)) throw new Error('Invalid receipt file scope.');
    const file = path.resolve(root, fileReceipt.path);
    const rootPath = path.resolve(root) + path.sep;
    if (!file.startsWith(rootPath)) throw new Error('Receipt path escapes root.');
    const content = await readFile(file, 'utf8');
    const parsed = splitLines(content);
    if (parsed.trailing_newline !== Boolean(fileReceipt.trailing_newline) || parsed.lines.length !== fileReceipt.lines.length) throw new Error('Line receipt count or newline state mismatch: ' + fileReceipt.path);
    let chain = GENESIS;
    for (let index = 0; index < parsed.lines.length; index++) {
      const actual = validateLine({ path: fileReceipt.path, line_number: index + 1, line: parsed.lines[index], previous_chain: chain });
      const expected = fileReceipt.lines[index];
      if (!actual.passed || expected.line_number !== index + 1 || expected.line_sha256 !== actual.line_sha256 || expected.previous_chain !== chain || expected.chain_sha256 !== actual.chain_sha256) throw new Error('Line receipt mismatch: ' + fileReceipt.path + ':' + (index + 1));
      chain = actual.chain_sha256;
      total += 1;
    }
    if (fileReceipt.final_chain_sha256 !== chain || fileReceipt.file_sha256 !== sha256(content)) throw new Error('Final line chain or file digest mismatch: ' + fileReceipt.path);
  }
  return { passed: true, contract: bundle.contract, files: bundle.files.length, lines: total, validator_independence: 'separate_process_and_trusted_replay' };
}

async function cli() {
  if (process.argv.includes('--validate-line')) {
    const input = JSON.parse(await readFile(0, 'utf8'));
    const result = validateLine(input);
    console.log(JSON.stringify(result));
    if (!result.passed) process.exitCode = 2;
    return;
  }
  if (process.argv.includes('--verify-receipts')) {
    const index = process.argv.indexOf('--verify-receipts');
    const root = process.argv[index + 1];
    const receipt = process.argv[index + 2];
    if (!root || !receipt) throw new Error('Usage: --verify-receipts <root> <receipt>');
    console.log(JSON.stringify(await verifyReceiptBundle(root, receipt)));
    return;
  }
  if (process.argv.includes('--self-check')) {
    const safe = validateLine({ path: 'src/components/example.jsx', line_number: 1, line: 'export const value = 1;', previous_chain: GENESIS });
    assert.equal(safe.passed, true);
    assert.equal(validateLine({ path: 'src/components/example.jsx', line_number: 2, line: 'const token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456";', previous_chain: safe.chain_sha256 }).passed, false);
    assert.equal(validateLine({ path: 'src/components/example.jsx', line_number: 2, line: 'const x = process.env.SECRET;', previous_chain: safe.chain_sha256 }).passed, false);
    assert.notEqual(validateLine({ path: 'src/components/example.jsx', line_number: 2, line: 'const b = 2;', previous_chain: safe.chain_sha256 }).chain_sha256, safe.chain_sha256);
    console.log(JSON.stringify({ passed: true, contract: 'INDEPENDENT_LINE_GATE_V1' }));
    return;
  }
  throw new Error('Choose --validate-line, --verify-receipts or --self-check.');
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) cli().catch(error => { console.error(error.message); process.exitCode = 1; });
`;

export const lineValidatorSelfTestSource = String.raw`import { validateLine } from './line-validator.mjs';
import assert from 'node:assert/strict';

const genesis = '0'.repeat(64);
const first = validateLine({ path:'src/components/example.jsx', line_number:1, line:'export default function Example() {', previous_chain:genesis });
assert.equal(first.passed, true);
const second = validateLine({ path:'src/components/example.jsx', line_number:2, line:'  return <div>safe</div>;', previous_chain:first.chain_sha256 });
assert.equal(second.passed, true);
assert.equal(validateLine({ path:'src/components/example.jsx', line_number:3, line:'  const x = process.env.SECRET;', previous_chain:second.chain_sha256 }).passed, false);
assert.equal(validateLine({ path:'src/components/example.jsx', line_number:3, line:'  return null;', previous_chain:'f'.repeat(64) }).previous_chain, 'f'.repeat(64));
console.log(JSON.stringify({ passed:true, contract:'INDEPENDENT_LINE_GATE_V1', independently_replayed_lines:2 }));
`;
