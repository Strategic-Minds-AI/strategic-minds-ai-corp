import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const { connectorId } = await req.json();
    const slots: Record<string, { url: string; provider: string }> = {
      '6ab15ad1cf868907e918178e': { provider: 'github', url: 'https://api.github.com/user' },
      '69e521c8418f5cecefb2567c': { provider: 'supabase', url: 'https://api.supabase.com/v1/projects' },
      '69db1e5e75a5f8c15c80cf34': { provider: 'drive', url: 'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)' }
    };
    const slot = slots[connectorId];
    if (!slot) return Response.json({ error: 'This OAuth slot is not registered for the vault.' }, { status: 400 });
    let accessToken;
    try { ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId)); }
    catch { return Response.json({ error: 'Connect this personal account first.' }, { status: 409 }); }
    const response = await fetch(slot.url, { headers: { Authorization: `Bearer ${accessToken}`, ...(slot.provider === 'github' ? { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'StrategicMindsAI' } : {}) } });
    const data = await response.json();
    if (!response.ok) return Response.json({ error: data.error?.message || data.message || 'Provider rejected access; check permissions.' }, { status: 502 });
    const name = slot.provider === 'github' ? data.login : slot.provider === 'drive' ? data.user?.emailAddress || data.user?.displayName : `${Array.isArray(data) ? data.length : 0} accessible projects`;
    return Response.json({ connected: true, provider: slot.provider, name });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Could not verify connection.' }, { status: 500 }); }
}