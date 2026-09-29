import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const allowed = new Set([
  '69db200274332486fd28dd7e',
  '6abbe8dc4ff4f4d2ecd95aa4',
  '6abbed6325bab487a6a06667',
  '6abbeb8a102f96ec70855440',
  '6abbecd20b04136d3ef3da21',
  '6abbebb5683767aff814cbe8',
  '6abbecb23c993078c3bf0f08',
  '6abbebea4801b98ec961a60b',
  '6abbec8dfc8de6e5b6ff7ae7',
  '6abbec1e310bbce28457b4f5'
]);

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to view Gmail accounts.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const { connectorId, action = 'profile' } = await req.json();
    if (!allowed.has(connectorId) || !['profile', 'recent'].includes(action)) return Response.json({ error: 'Invalid account request.' }, { status: 400 });
    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId));
    } catch {
      return Response.json({ error: 'This inbox is not connected.' }, { status: 409 });
    }
    const headers = { Authorization: `Bearer ${accessToken}` };
    const gmail = async (path: string) => {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers });
      if (!response.ok) throw new Error(`Gmail could not load this inbox (${response.status}).`);
      return await response.json();
    };
    const profile = await gmail('profile');
    if (action === 'profile') return Response.json({ email: profile.emailAddress, messagesTotal: profile.messagesTotal });
    const list = await gmail('messages?maxResults=5&labelIds=INBOX');
    const messages = await Promise.all((list.messages || []).map(async (item: { id: string }) => {
      const data = await gmail(`messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`);
      const header = (name: string) => data.payload?.headers?.find((h: { name: string; value: string }) => h.name.toLowerCase() === name)?.value || '';
      return { id: data.id, subject: header('subject') || '(No subject)', from: header('from'), date: header('date') };
    }));
    return Response.json({ email: profile.emailAddress, messages });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not load Gmail.' }, { status: 500 });
  }
}