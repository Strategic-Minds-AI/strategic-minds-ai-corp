// SYSTEM NOTATION: All LLM calls route through the Vercel AI Gateway
// (base44/shared/aiGateway.ts) via this backend function — never the built-in InvokeLLM.
// Build mode executes real actions through native tool calling.
import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';
import { benchmarkAgentPolicy } from '../../shared/benchmarkPrompts.ts';
import { benchmarkAssistantContext } from '../../shared/benchmarkAssistantContext.ts';
import { ASSISTANT_TOOLS, executeAssistantTool } from '../../shared/adminAssistantTools.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Sign in to use the assistant.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const key = secrets.get('AI_GATEWAY_API_KEY');
    if (!key) return Response.json({ error: 'The chat server cannot authenticate with Vercel AI Gateway. Enable Vercel authentication or configure the gateway key on the backend host.' }, { status: 503 });
    const body = await req.json();
    if (!Array.isArray(body.messages)) return Response.json({ error: 'Messages are required.' }, { status: 400 });
    const maxTokens = body.maxOutputTokens;
    if (maxTokens !== undefined && (!Number.isSafeInteger(maxTokens) || maxTokens < 256 || maxTokens > 8192)) return Response.json({ error: 'Invalid output limit.' }, { status: 400 });
    const messages = body.messages.slice(-12).filter((m: any) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim().length > 0 && m.content.length <= 4000).map((m: any) => ({ role: m.role, content: m.content }));
    if (!messages.length || messages.at(-1)?.role !== 'user') return Response.json({ error: 'Enter a message to continue.' }, { status: 400 });
    const checkpointContext = await benchmarkAssistantContext(base44, user.id);
    const db = base44.asServiceRole;
    const modeGuidance = body.executionMode === 'build'
      ? 'BUILD MODE: Carry out the admin commands directly using your tools. Create system builds, provision sites and infrastructure, send SMS, manage domains, create blog posts and projects, run audits, and dispatch tasks to specialist agents. Do not just describe what could be done — do it. Confirm what you did with the tool results.'
      : 'PLAN MODE: Research and analyze using your tools, then propose concrete actions. You can still execute read-only queries and create drafts. When the admin asks you to do something, do it.';
    const systemPrompt = `You are the Strategic Minds AI agency administrator assistant. You help with planning, writing, answering questions, and executing real actions. When the admin asks you to do something, use your tools to carry it out — do not just describe what could be done. You have tools to create system builds, provision sites and infrastructure, send SMS, manage domains, run business audits, create blog posts and projects, manage testimonials, query live data, and dispatch tasks to specialist agents.\n\n${modeGuidance}\n\n${benchmarkAgentPolicy}\n\nCurrent owner-scoped benchmark context (progress notes are not certified completion):\n${checkpointContext}\n\nPersonal instructions:\n${typeof (user as any).assistant_instructions === 'string' ? (user as any).assistant_instructions.slice(0, 15000) : ''}`;
    const history: any[] = [{ role: 'system', content: systemPrompt }, ...messages];
    const toolResults: any[] = [];
    for (let round = 0; round < 5; round++) {
      const result = await callAIGateway({ messages: history, tools: ASSISTANT_TOOLS, maxTokens: maxTokens || 4000 });
      if (!result.tool_calls?.length) return Response.json({ reply: result.content, tool_results: toolResults });
      history.push(result.message);
      for (const call of result.tool_calls) {
        if (!ASSISTANT_TOOLS.some(t => t.function.name === call.function.name)) throw new Error('Unapproved assistant tool');
        const args = JSON.parse(call.function.arguments || '{}');
        const toolResult = await executeAssistantTool(db, call.function.name, args);
        toolResults.push({ tool: call.function.name, result: JSON.parse(toolResult) });
        history.push({ role: 'tool', tool_call_id: call.id, content: toolResult });
      }
    }
    const result = await callAIGateway({ messages: history, maxTokens: maxTokens || 4000 });
    return Response.json({ reply: result.content, tool_results: toolResults });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to reach the assistant.' }, { status: 500 });
  }
}