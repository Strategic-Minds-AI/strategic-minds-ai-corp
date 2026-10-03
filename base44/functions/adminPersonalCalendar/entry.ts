import { createClientFromRequest } from '../../shared/ownedClient.ts';

const connectorId = '6aa76cc2470fe12f80973720';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to use Calendar.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const body = await req.json();
    let accessToken: string;
    try { ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId)); }
    catch { return Response.json({ error: 'Connect your personal Calendar first.' }, { status: 409 }); }
    const create = body.action === 'create';
    if (body.action && !['list', 'create'].includes(body.action)) return Response.json({ error: 'Invalid Calendar action.' }, { status: 400 });
    if (create && (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 || typeof body.start !== 'string' || typeof body.end !== 'string' || !Number.isFinite(Date.parse(body.start)) || !Number.isFinite(Date.parse(body.end)) || Date.parse(body.end) <= Date.parse(body.start))) return Response.json({ error: 'Enter a title and valid start and end times.' }, { status: 400 });
    const params = new URLSearchParams({ maxResults: '25', singleEvents: 'true', orderBy: 'startTime', timeMin: new Date().toISOString() });
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events${create ? '' : `?${params}`}`, {
      method: create ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, ...(create ? { 'Content-Type': 'application/json' } : {}) },
      ...(create ? { body: JSON.stringify({ summary: body.title.trim(), start: { dateTime: new Date(body.start).toISOString() }, end: { dateTime: new Date(body.end).toISOString() } }) } : {})
    });
    const result = await response.json();
    if (!response.ok) return Response.json({ error: result.error?.message || 'Calendar request failed.' }, { status: 502 });
    return Response.json(create ? { event: { id: result.id, summary: result.summary, htmlLink: result.htmlLink } } : { events: (result.items || []).map((event: any) => ({ id: event.id, summary: event.summary || '(Untitled)', start: event.start?.dateTime || event.start?.date, htmlLink: event.htmlLink })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Calendar unavailable.' }, { status: 500 });
  }
}