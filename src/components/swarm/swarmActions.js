import { base44 } from '@/api/base44Client';
import { agentById, presets } from '@/components/swarm/catalog';

export async function dispatchTasks(run, tasks) {
  let cursor = 0;
  let failed = false;
  const worker = async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      try {
        const agent = agentById(task.agent_id);
        await base44.entities.SwarmTask.update(task.id, { status: 'dispatching', error: '' });
        const conversation = await base44.agents.createConversation({ agent_name: agent.agent, metadata: { name: `${agent.name} · ${run.title}`, description: `Swarm run ${run.id}` } });
        await base44.entities.SwarmTask.update(task.id, { conversation_id: conversation.id });
        await base44.agents.addMessage(conversation, { role: 'user', content: `Role: ${agent.name}\nFocus: ${agent.description}\nWorking instructions: ${presets[run.preset]?.instructions || presets.general.instructions}\nShared objective:\n${run.prompt}\n\nWork independently on your role's contribution. Do not invent contributions from other agents. No private integrations or execution sandbox are connected.` });
        await base44.entities.SwarmTask.update(task.id, { status: 'submitted' });
      } catch (error) {
        failed = true;
        await base44.entities.SwarmTask.update(task.id, { status: 'error', error: String(error.message || 'Agent dispatch failed. Check runtime access and credits, then start a new run.').slice(0, 2000) });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(run.concurrency || 3, tasks.length) }, worker));
  await base44.entities.SwarmRun.update(run.id, { status: failed ? 'needs_attention' : 'submitted' });
}

export async function createSwarm({ prompt, selected, preset, runtime, concurrency }, onCreated) {
  const clean = prompt.trim();
  if (!clean || clean.length > 12000 || !selected.length || selected.length > 30 || selected.some(id => !agentById(id))) throw new Error('Enter an objective and select between 1 and 30 agents.');
  const run = await base44.entities.SwarmRun.create({ title: clean.slice(0, 64), prompt: clean, agent_ids: selected, preset, runtime, concurrency: Math.max(1, Math.min(5, Number(concurrency))), status: runtime === 'chatgpt' ? 'awaiting_chatgpt' : 'dispatching' });
  try {
    const tasks = await base44.entities.SwarmTask.bulkCreate(selected.map(id => ({ run_id: run.id, agent_id: id, agent_name: agentById(id).name, status: 'queued' })));
    onCreated(run);
    if (runtime === 'native') await dispatchTasks(run, tasks);
  } catch (error) {
    await base44.entities.SwarmRun.update(run.id, { status: 'needs_attention' });
    throw error;
  }
  return run;
}

export function handoffText(run) {
  return `Use my connected Swarm app via MCP. Read SwarmRun ${run.id} and its SwarmTask records (run_id: ${run.id}). Work on each selected agent's role, in parallel if your runtime supports it, using only tools I have authorized in this ChatGPT conversation. Do not call the app's native agent tools unless I approve their separate credit usage. For each task, write a Markdown result to output (maximum 30000 characters) and set status to completed; record failures honestly. Never claim unavailable tools or fabricate execution. Shared objective: ${run.prompt}`;
}