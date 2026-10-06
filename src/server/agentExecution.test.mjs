import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({ entryPoints: ['base44/functions/runAgentLoop/entry.ts'], bundle: true, platform: 'node', format: 'esm', write: false, plugins: [{ name: 'agent-test-fixtures', setup(builder) {
  builder.onResolve({ filter: /shared\/(ownedClient|aiGateway)\.ts$/ }, args => ({ path: args.path.includes('ownedClient') ? 'client' : 'gateway', namespace: 'fixtures' }));
  builder.onLoad({ filter: /.*/, namespace: 'fixtures' }, args => ({ contents: args.path === 'client' ? 'export const createClientFromRequest = () => globalThis.agentTestClient;' : 'export const callAIGateway = () => { throw new Error("Model connection failed"); };', loader: 'js' }));
} }] });
const { default: runAgentLoop } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
test('Agent tasks cannot claim completion without a configured successful executor', async () => {
  const tasks = ['build_system', 'code_audit', 'general', 'google_connect', 'social_connect', 'index_check', 'competitor_scan', 'content_optimize', 'growth_audit'].map((task_type, index) => ({ id: `test-task-${index}`, task_type, title: task_type, autonomous: true, status: 'pending' }));
  const previous = globalThis.agentTestClient;
  globalThis.agentTestClient = {
    auth: { me: async () => ({ id: 'fixture-admin', role: 'admin' }) },
    entities: { AgentTask: { filter: async () => ({ items: tasks }), update: async (id, patch) => Object.assign(tasks.find(task => task.id === id), patch) } },
    functions: { invoke: async () => ({ data: { ok: false, error: 'Growth execution failed' } }) },
  };
  try {
    const response = await runAgentLoop(new Request('https://fixture.test', { method: 'POST', body: JSON.stringify({ max_cycles: 1 }) }));
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.actions_executed, 0);
    assert.ok(tasks.slice(0, 6).every(task => task.status === 'needs_approval'));
    assert.ok(tasks.slice(6).every(task => task.status === 'failed'));
    assert.ok(result.trace.every(step => step.phase !== 'completed'));
  } finally { globalThis.agentTestClient = previous; }
});