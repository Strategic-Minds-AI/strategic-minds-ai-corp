import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { capabilityRecord, configuredSurfaces } from '../../shared/apexInventory.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in for discovery.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const checkedAt = new Date().toISOString();
    const probes = [
      { id: 'drive.read', provider: 'Google Drive', type: 'googledrive', category: 'files', name: 'Drive file-list read access', url: 'https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)' },
      { id: 'gmail.read', provider: 'Gmail', type: 'gmail', category: 'communications', name: 'Gmail profile read access', url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile' },
      { id: 'contacts.read', provider: 'Google Contacts', type: 'google_contacts', category: 'contacts', name: 'Contact-list read access', url: 'https://people.googleapis.com/v1/people/me/connections?personFields=names&pageSize=1' },
      { id: 'calendar.read', provider: 'Google Calendar', type: 'googlecalendar', category: 'calendar', name: 'Shared Calendar event-read access', url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1' },
      { id: 'github.read', provider: 'GitHub', type: 'github', category: 'infrastructure', name: 'Shared repository-list read access', url: 'https://api.github.com/user/repos?per_page=1' },
      { id: 'supabase.read', provider: 'Supabase', type: 'supabase', category: 'infrastructure', name: 'Shared project-list read access', url: 'https://api.supabase.com/v1/projects' },
      { id: 'analytics.read', provider: 'Google Analytics', type: 'google_analytics', category: 'analytics', name: 'Analytics account-summary read access', url: 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=1' },
      { id: 'search_console.read', provider: 'Google Search Console', type: 'google_search_console', category: 'analytics', name: 'Search Console site-list read access', url: 'https://www.googleapis.com/webmasters/v3/sites' },
      { id: 'vercel.read', provider: 'Vercel', category: 'infrastructure', name: 'Project-list read access', url: 'https://api.vercel.com/v10/projects?limit=1', token: secrets.get('VERCEL_API_TOKEN') },
      { id: 'railway.read', provider: 'Railway', category: 'infrastructure', name: 'Project-list read access', url: 'https://backboard.railway.com/graphql/v2', token: secrets.get('RAILWAY_API_TOKEN'), query: 'query { projects { edges { node { id } } } }' },
      { id: 'stripe.read', provider: 'Stripe', category: 'payments', name: 'Balance read access (configured sandbox account)', url: 'https://api.stripe.com/v1/balance', token: secrets.get('STRIPE_SECRET_KEY') },
      { id: 'gateway.models', provider: 'Vercel AI Gateway', category: 'models', name: 'Model-catalog read access', url: 'https://ai-gateway.vercel.sh/v1/models', token: secrets.get('AI_GATEWAY_API_KEY') }
    ];
    let models: string[] = [];
    const live = await Promise.all(probes.map(async (probe: any) => {
      let token = probe.token;
      try {
        if (probe.type) ({ accessToken: token } = await base44.asServiceRole.connectors.getConnection(probe.type));
        if (!token) return capabilityRecord({ ...probe, availability: 'MISSING_PERMISSION', health: 'Permission Required', auth: 'unverified', access: 'none', reason: 'No usable credential found.', source: probe.url, approval: 'READ only; no protected actions executed' });
        const response = await fetch(probe.url, { signal: AbortSignal.timeout(10000), method: probe.query ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, ...(probe.type === 'github' ? { Accept: 'application/vnd.github+json', 'User-Agent': 'StrategicMindsAI' } : {}), ...(probe.query ? { 'Content-Type': 'application/json' } : {}) }, ...(probe.query ? { body: JSON.stringify({ query: probe.query }) } : {}) });
        const data = await response.json(); const ok = response.ok && !data.errors?.length;
        if (probe.id === 'gateway.models' && ok) models = (data.data || []).filter((model: any) => typeof model.id === 'string').map((model: any) => model.id);
        return capabilityRecord({ ...probe, availability: ok ? 'PARITY_VERIFIED' : [401,403].includes(response.status) ? 'MISSING_PERMISSION' : 'UNKNOWN', health: ok ? 'Connected' : 'Degraded', auth: ok ? 'verified_for_this_read' : 'request_failed', access: ok ? 'read_only_verified' : 'not_verified', boundary: 'Admin-only read probe; shared authorization is not individual-user authorization', approval: 'READ only; writes and new spend require separate approval', validation: ok ? 'PASS_READ_PROBE_ONLY' : 'FAIL_READ_PROBE', reason: ok ? null : `Provider read failed (HTTP ${response.status}); no response contents or secrets returned.`, source: `${probe.url} — live read response` }, ok ? checkedAt : null);
      } catch { return capabilityRecord({ ...probe, availability: 'UNKNOWN', health: 'Unknown', access: 'not_verified', reason: 'Connection retrieval, timeout, or provider read failed; execution remains blocked.', source: probe.url }, null); }
    }));
    return Response.json({ registry_version: 1, observed_at: checkedAt, persistence: 'session_only; export available; durable storage awaits approval', scope: 'Existing agency app plus read-only provider probes; not an inventory of the private ChatGPT account', capabilities: [...live, ...configuredSurfaces.map(item => capabilityRecord(item))], models: { source: 'Vercel AI Gateway model catalog', catalog_only: true, inference_verified: false, ids: models }, skills: { runtime_verified: false, project_references: ['base44-cli','base44-remote-dev','base44-sandbox','base44-sdk','base44-troubleshooter'], note: 'References discovered in project inventory; instructions and runtime execution not imported' }, plugins: { availability: 'UNKNOWN', inventory: [], operator_reported_tools: 4437, operator_reported_namespaces: 58, counts_independently_verified: false }, protected_actions_performed: [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Discovery unavailable; no capability should be assumed from this failure.' }, { status: 500 }); }
}