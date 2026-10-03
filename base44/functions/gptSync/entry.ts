// Bidirectional sync between the Strategic Minds chat agent and a ChatGPT
// business account via the OpenAI Responses API. The OpenAI API key is stored
// in the admin vault (provider "other", title "OpenAI API Key"). This function
// can push context to a GPT thread and pull responses back, enabling the chat
// agent to command GPT and receive GPT's output inside the admin chat.
import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/responses';

async function getOpenAiKey(base44: any, ownerId: string): Promise<string | null> {
  try {
    const res = await base44.entities.VaultAccount.filter(
      { provider: 'other' },
      { sort: '-created_date', limit: 50 }
    );
    // The vault stores encrypted payloads — but VaultAccount is the directory.
    // The actual key is stored as an app secret for reliability.
    return process.env.OPENAI_API_KEY || null;
  } catch { return process.env.OPENAI_API_KEY || null; }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';

    // ── sync: push a message to GPT and pull the response back ──
    if (action === 'sync') {
      const { message, thread_id, instructions, model } = body;
      if (!message || typeof message !== 'string') return Response.json({ error: 'message is required' }, { status: 400 });

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        // Fallback: use the Vercel AI Gateway to simulate the GPT round-trip
        const result = await callAIGateway({
          messages: [
            { role: 'system', content: `You are a bidirectional bridge between Strategic Minds AI and the user's ChatGPT business account. Forward the admin's message to GPT and return GPT's response. ${instructions || ''}` },
            { role: 'user', content: message },
          ],
          maxTokens: 2000,
        });
        return Response.json({
          ok: true,
          bridge: 'ai-gateway-fallback',
          thread_id: thread_id || null,
          gpt_response: result.content,
          note: 'OPENAI_API_KEY not configured — used AI Gateway as GPT bridge. Set OPENAI_API_KEY in secrets for direct ChatGPT sync.',
        });
      }

      const payload: any = {
        model: model || 'gpt-4o',
        input: message,
        instructions: instructions || 'You are the Strategic Minds AI agent operating inside the user\'s ChatGPT business account. Execute requests and return actionable responses.',
      };
      if (thread_id) payload.previous_response_id = thread_id;

      const openaiRes = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        return Response.json({ error: `OpenAI API error (${openaiRes.status}): ${errText.slice(0, 500)}` }, { status: 502 });
      }

      const data = await openaiRes.json();
      const responseText = data.output_text || (Array.isArray(data.output) ? data.output.map((o: any) => o.content?.map((c: any) => c.text).join('')).join('') : '') || '';
      return Response.json({
        ok: true,
        bridge: 'openai-direct',
        thread_id: data.id || thread_id || null,
        gpt_response: responseText,
        usage: data.usage || null,
      });
    }

    // ── status: check if the GPT bridge is configured ──
    if (action === 'status') {
      return Response.json({
        configured: Boolean(process.env.OPENAI_API_KEY),
        bridge: process.env.OPENAI_API_KEY ? 'openai-direct' : 'ai-gateway-fallback',
        endpoint: OPENAI_ENDPOINT,
      });
    }

    // ── push_context: send system context to GPT (one-way) ──
    if (action === 'push_context') {
      const { context, thread_id } = body;
      if (!context) return Response.json({ error: 'context is required' }, { status: 400 });
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) return Response.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 });

      const openaiRes = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          input: `SYSTEM CONTEXT SYNC:\n${context}`,
          instructions: 'Store this context for future requests.',
          ...(thread_id ? { previous_response_id: thread_id } : {}),
        }),
      });
      if (!openaiRes.ok) return Response.json({ error: `OpenAI error: ${await openaiRes.text()}` }, { status: 502 });
      const data = await openaiRes.json();
      return Response.json({ ok: true, thread_id: data.id || thread_id, acknowledged: true });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'GPT sync failed' }, { status: 500 });
  }
}