import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateLine, verifyReceiptBundle } from './line-validator.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const genesis = '0'.repeat(64);
const root = await mkdtemp(path.join(os.tmpdir(), 'line-gate-'));
try {
  const rel = 'src/components/example.jsx';
  const file = path.join(root, rel);
  await mkdir(path.dirname(file), { recursive: true });
  const content = 'export const a = 1;\nexport const b = 2;\n';
  await writeFile(file, content, 'utf8');

  let chain = genesis;
  const lines = content.trimEnd().split('\n').map((line, i) => {
    const receipt = validateLine({ path: rel, line_number: i + 1, line, previous_chain: chain });
    assert.equal(receipt.passed, true);
    chain = receipt.chain_sha256;
    return receipt;
  });

  assert.equal(validateLine({ path: rel, line_number: 1, line: 'export const x = 1;', previous_chain: 'f'.repeat(64) }).code, 'FIRST_LINE_REQUIRES_GENESIS');

  const receiptPath = path.join(root, 'receipts.json');
  const bundle = { schema_version: 1, contract: 'INDEPENDENT_LINE_GATE_V1', files: [{ path: rel, trailing_newline: true, file_sha256: sha(content), final_chain_sha256: chain, lines }] };
  await writeFile(receiptPath, JSON.stringify(bundle), 'utf8');
  const verified = await verifyReceiptBundle(root, receiptPath);
  assert.equal(verified.passed, true);
  assert.equal(verified.lines, 2);

  await writeFile(file, 'export const a = 9;\nexport const b = 2;\n', 'utf8');
  await assert.rejects(() => verifyReceiptBundle(root, receiptPath));

  await writeFile(file, content, 'utf8');
  const tampered = structuredClone(bundle);
  tampered.files[0].lines[1].previous_chain = 'f'.repeat(64);
  await writeFile(receiptPath, JSON.stringify(tampered), 'utf8');
  await assert.rejects(() => verifyReceiptBundle(root, receiptPath));

  console.log(JSON.stringify({ passed: true, contract: 'INDEPENDENT_LINE_GATE_V1', tamper_tests: 2, replayed_lines: 2 }));
} finally {
  await rm(root, { recursive: true, force: true });
}
