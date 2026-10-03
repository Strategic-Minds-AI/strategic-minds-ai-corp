import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { buildSystemPrompt, AGENT_INSTRUCTIONS } from '../../shared/agentInstructions.ts';
import { ASSISTANT_TOOLS, executeAssistantTool } from '../../shared/adminAssistantTools.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    // Use service role for all entity/function calls — the Supabase JWT is not
    // recognized by Base44 RLS, so asServiceRole bypasses it (we already verified
    // admin role via getSupabaseUser above).
    const db = base44.asServiceRole;

    const body = await req.json();
    const agentName = body.agent_name;
    const history: Array<{ role: string; content: string }> = body.messages || [];

    if (!AGENT_INSTRUCTIONS[agentName]) {
      return Response.json({ error: `Unknown agent: ${agentName}` }, { status: 400 });
    }

    // Fetch live system context for the system prompt
    const [pendingRes, completedRes, domainRes, buildRes, batchRes] = await Promise.all([
      db.entities.AgentTask.count({ status: 'pending' }),
      db.entities.AgentTask.count({ status: 'completed' }),
      db.entities.Domain.count({}),
      db.entities.SystemBuild.count({}),
      db.entities.BatchOperation.count({})
    ]);

    const systemPrompt = buildSystemPrompt(agentName, {
      pendingTasks: pendingRes,
      completedTasks: completedRes,
      domains: domainRes,
      systemBuilds: buildRes,
      batchOps: batchRes
    });

    // Build messages for the API call
    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    for (const m of history) {
      messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }

    // Native tool calling through the owner's gateway, with a bounded execution loop.
    const toolResults: any[] = [];
    for (let round = 0; round < 5; round++) {
      const result = await callAIGateway({ messages, tools: ASSISTANT_TOOLS, maxTokens: 4000 });
      if (!result.tool_calls?.length) return Response.json({ agent_name: agentName, content: result.content, tool_results: toolResults, model: result.model, usage: result.usage });
      messages.push(result.message);
      for (const call of result.tool_calls) {
        if (!ASSISTANT_TOOLS.some(tool => tool.function.name === call.function.name)) throw new Error('Unapproved agent tool');
        const args = JSON.parse(call.function.arguments || '{}');
        const toolResult = await executeAssistantTool(db, call.function.name, args);
        toolResults.push({ tool: call.function.name, result: JSON.parse(toolResult) });
        messages.push({ role: 'tool', tool_call_id: call.id, content: toolResult });
      }
    }
    const result = await callAIGateway({ messages, maxTokens: 4000 });
    return Response.json({ agent_name: agentName, content: result.content, tool_results: toolResults, model: result.model, usage: result.usage });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}