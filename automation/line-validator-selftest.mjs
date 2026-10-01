import { validateLine } from './line-validator.mjs';
import assert from 'node:assert/strict';

const genesis = '0'.repeat(64);
const first = validateLine({ path:'src/components/example.jsx', line_number:1, line:'export default function Example() {', previous_chain:genesis });
assert.equal(first.passed, true);
const second = validateLine({ path:'src/components/example.jsx', line_number:2, line:'  return <div>safe</div>;', previous_chain:first.chain_sha256 });
assert.equal(second.passed, true);
assert.equal(validateLine({ path:'src/components/example.jsx', line_number:3, line:'  const x = process.env.SECRET;', previous_chain:second.chain_sha256 }).passed, false);
assert.equal(validateLine({ path:'src/components/example.jsx', line_number:3, line:'  return null;', previous_chain:'f'.repeat(64) }).previous_chain, 'f'.repeat(64));
console.log(JSON.stringify({ passed:true, contract:'INDEPENDENT_LINE_GATE_V1', independently_replayed_lines:2 }));
