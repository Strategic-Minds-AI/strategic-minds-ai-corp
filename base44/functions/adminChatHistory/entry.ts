import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatKey, pageOffset } from '../../shared/adminChatValidation.ts';
import { deleteConversations } from '../../shared/adminChatConversations.ts';
import { beginTurn, finishTurn } from '../../shared/adminChatTurns.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    if (req.method !== 'POST') return Response.json({ error: 'Use POST.' }, { status: 405 });
    const text = await req.text();
    if (text.length > 150000) return Response.json({ error: 'History request is too large.' }, { status: 413 });
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== 'object') return Response.json({ error: 'Invalid history request.' }, { status: 400 });
    if (body.ownerId !== undefined && body.ownerId !== user.id) return Response.json({ error: 'History belongs to the signed-in administrator only.' }, { status: 403 });
    if (Object.keys(body).some(key => !['action','ownerId','chatKey','chatKeys','title','turnKey','userMessage','assistantMessage','error','skip','before'].includes(key))) return Response.json({ error: 'Unexpected history input.' }, { status: 400 });
    let result;
    if (['conversations','turns'].includes(body.action)) {
      const skip = pageOffset(body.skip); let entity; let query = { owner_id: user.id };
      if (body.action === 'conversations') entity = base44.entities.AdminConversation;
      else {
        if (!Array.isArray(body.chatKeys) || !body.chatKeys.length || body.chatKeys.length > 40) return Response.json({ error: 'Provide up to 40 conversation references.' }, { status: 400 });
        query.chat_key = { $in: body.chatKeys.map(chatKey) }; entity = base44.entities.AdminChatTurn;
      }
      const rows = await entity.filter(query, 'created_date', 40, skip);
      result = { rows, nextSkip: rows.length === 40 ? skip + 40 : null };
    } else if (body.action === 'prepareClear') result = { before: new Date().toISOString() };
    else if (body.action === 'begin' || body.action === 'import') result = await beginTurn(base44, user.id, body, body.action === 'import');
    else if (body.action === 'complete' || body.action === 'fail') result = await finishTurn(base44, user.id, body, body.action === 'fail');
    else if (body.action === 'delete') result = await deleteConversations(base44, user.id, chatKey(body.chatKey));
    else if (body.action === 'clear') {
      if (typeof body.before !== 'string' || !Number.isFinite(Date.parse(body.before)) || Date.parse(body.before) > Date.now() + 5000) return Response.json({ error: 'Prepare a history clear before confirming it.' }, { status: 400 });
      result = await deleteConversations(base44, user.id, null, new Date(body.before).toISOString());
    } else return Response.json({ error: 'Unknown history action.' }, { status: 400 });
    return Response.json(result, { status: result.status || 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error.response?.status || (/^(Invalid|Use private)/.test(error.message || '') || error instanceof SyntaxError ? 400 : 500);
    return Response.json({ error: error.message || 'Conversation history could not be synchronized.' }, { status });
  }
}