import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';

const VALID_ACTIONS = ['provisionWorkspace', 'scheduleKickoff', 'aiAssist', 'syncContact', 'seedChecklist', 'dashboardStats'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    if (req.method !== 'POST') return Response.json({ error: 'Use POST.' }, { status: 405 });

    const body = await req.json();
    const action = String(body.action || '');
    if (!VALID_ACTIONS.includes(action)) return Response.json({ error: 'Unknown onboarding action.' }, { status: 400 });

    // ── Dashboard stats ──
    if (action === 'dashboardStats') {
      const clients = await base44.entities.OnboardingClient.list();
      const tasks = await base44.entities.ClientTask.list();
      const total = clients.length;
      const active = clients.filter(c => ['Onboarding', 'Active'].includes(c.onboarding_status)).length;
      const pipelineValue = clients.reduce((sum, c) => sum + (c.contract_value || 0), 0);
      const stuckClients = clients.filter(c => {
        if (['Completed', 'Active'].includes(c.onboarding_status)) return false;
        const updated = new Date(c.updated_at || c.created_at);
        return (Date.now() - updated.getTime()) > 7 * 86400000;
      }).map(c => ({ id: c.id, company_name: c.company_name, onboarding_status: c.onboarding_status, days_stuck: Math.floor((Date.now() - new Date(c.updated_at || c.created_at).getTime()) / 86400000) }));
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      return Response.json({ total, active, pipelineValue, stuckClients, totalTasks: tasks.length, completedTasks });
    }

    // ── Seed master checklist ──
    if (action === 'seedChecklist') {
      const existing = await base44.entities.OnboardingChecklistItem.list();
      if (existing.length > 0) return Response.json({ ok: true, message: 'Checklist already seeded', count: existing.length });
      const seedItems = [
        { title: 'Send welcome email with onboarding overview', category: 'Communication', sort_order: 1, default_due_days: 0, is_required: true, google_workspace_action: 'none' },
        { title: 'Create Google Drive client folder structure', category: 'Admin', sort_order: 2, default_due_days: 1, is_required: true, google_workspace_action: 'create_drive_folder' },
        { title: 'Add primary contact to Google Contacts', category: 'Admin', sort_order: 3, default_due_days: 1, is_required: true, google_workspace_action: 'create_contact' },
        { title: 'Schedule kickoff call on Google Calendar', category: 'Communication', sort_order: 4, default_due_days: 3, is_required: true, google_workspace_action: 'schedule_kickoff' },
        { title: 'Send intake questionnaire', category: 'Discovery', sort_order: 5, default_due_days: 2, is_required: true, google_workspace_action: 'none' },
        { title: 'Conduct discovery session', category: 'Discovery', sort_order: 6, default_due_days: 5, is_required: true, google_workspace_action: 'none' },
        { title: 'Create project brief document', category: 'Setup', sort_order: 7, default_due_days: 7, is_required: true, google_workspace_action: 'create_doc' },
        { title: 'Set up tracking spreadsheet', category: 'Setup', sort_order: 8, default_due_days: 7, is_required: false, google_workspace_action: 'create_sheet' },
        { title: 'Configure access and permissions', category: 'Setup', sort_order: 9, default_due_days: 10, is_required: true, google_workspace_action: 'none' },
        { title: 'Send weekly progress update', category: 'Communication', sort_order: 10, default_due_days: 14, is_required: false, google_workspace_action: 'none' },
        { title: 'Deliver first milestone', category: 'Delivery', sort_order: 11, default_due_days: 21, is_required: true, google_workspace_action: 'none' },
        { title: 'Collect feedback and sign-off', category: 'Delivery', sort_order: 12, default_due_days: 30, is_required: true, google_workspace_action: 'none' },
      ];
      await base44.entities.OnboardingChecklistItem.bulkCreate(seedItems);
      return Response.json({ ok: true, count: seedItems.length });
    }

    // ── Provision Google Workspace for a client ──
    if (action === 'provisionWorkspace') {
      const clientId = String(body.clientId || '');
      if (!clientId) return Response.json({ error: 'Client ID required.' }, { status: 400 });
      const client = await base44.entities.OnboardingClient.get(clientId);
      if (!client) return Response.json({ error: 'Client not found.' }, { status: 404 });

      const results: any = { drive: null, contact: null, calendar: null };

      // 1. Create Google Drive folder structure
      if (!client.google_drive_folder_id) {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
          const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
          // Find or create "Strategic Minds AI / Clients / {Company}" folder chain
          let parentId = 'root';
          for (const folderName of ['Strategic Minds AI', 'Clients', client.company_name]) {
            const q = `'${parentId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
            const searchResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`, { headers });
            const searchData = await searchResp.json();
            if (searchData.files?.length) {
              parentId = searchData.files[0].id;
            } else {
              const createResp = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
                method: 'POST', headers,
                body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] })
              });
              const created = await createResp.json();
              if (!createResp.ok) throw new Error(created.error?.message || 'Drive folder creation failed');
              parentId = created.id;
              results.drive = { folderId: created.id, folderUrl: created.webViewLink, created: true };
            }
          }
          if (!results.drive) {
            // Folder already existed, get its URL
            const metaResp = await fetch(`https://www.googleapis.com/drive/v3/files/${parentId}?fields=id,webViewLink`, { headers });
            const metaData = await metaResp.json();
            results.drive = { folderId: parentId, folderUrl: metaData.webViewLink, created: false };
          }
          await base44.entities.OnboardingClient.update(clientId, {
            google_drive_folder_id: results.drive.folderId,
            google_drive_folder_url: results.drive.folderUrl
          });
        } catch (e) {
          results.drive = { error: e.message };
        }
      }

      // 2. Create Google Contact
      if (!client.google_contact_resource && client.contact_email) {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_contacts');
          const resp = await fetch('https://people.googleapis.com/v1/people:createContact', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              names: [{ givenName: client.contact_name || client.company_name }],
              emailAddresses: [{ value: client.contact_email }],
              ...(client.contact_phone ? { phoneNumbers: [{ value: client.contact_phone }] } : {}),
              organizations: [{ name: client.company_name }]
            })
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error?.message || 'Contact creation failed');
          results.contact = { resourceName: data.resourceName };
          await base44.entities.OnboardingClient.update(clientId, { google_contact_resource: data.resourceName });
        } catch (e) {
          results.contact = { error: e.message };
        }
      }

      return Response.json({ ok: true, results });
    }

    // ── Schedule kickoff call on Google Calendar ──
    if (action === 'scheduleKickoff') {
      const clientId = String(body.clientId || '');
      const start = new Date(body.start);
      if (!clientId || !Number.isFinite(start.getTime()) || start.getTime() < Date.now())
        return Response.json({ error: 'Provide a client and future start time.' }, { status: 400 });

      const client = await base44.entities.OnboardingClient.get(clientId);
      if (!client) return Response.json({ error: 'Client not found.' }, { status: 404 });

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: `Kickoff Call — ${client.company_name}`,
          description: `Onboarding kickoff call with ${client.company_name}.\nContact: ${client.contact_name || 'N/A'}\nService: ${client.service_type || 'N/A'}\n\nStrategic Minds AI — https://strategicmindsai.com`,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          attendees: client.contact_email ? [{ email: client.contact_email }] : [],
          location: 'Google Meet'
        })
      });
      const data = await resp.json();
      if (!resp.ok) return Response.json({ error: data.error?.message || 'Calendar event creation failed' }, { status: 500 });
      await base44.entities.OnboardingClient.update(clientId, {
        google_calendar_event_id: data.id,
        kickoff_scheduled_at: start.toISOString()
      });
      return Response.json({ ok: true, eventId: data.id, htmlLink: data.htmlLink });
    }

    // ── Sync contact to Google Contacts ──
    if (action === 'syncContact') {
      const clientId = String(body.clientId || '');
      const client = await base44.entities.OnboardingClient.get(clientId);
      if (!client || !client.contact_email) return Response.json({ error: 'Client with email required.' }, { status: 400 });
      if (client.google_contact_resource) return Response.json({ ok: true, message: 'Already synced' });
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_contacts');
      const resp = await fetch('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          names: [{ givenName: client.contact_name || client.company_name }],
          emailAddresses: [{ value: client.contact_email }],
          ...(client.contact_phone ? { phoneNumbers: [{ value: client.contact_phone }] } : {}),
          organizations: [{ name: client.company_name }]
        })
      });
      const data = await resp.json();
      if (!resp.ok) return Response.json({ error: data.error?.message || 'Contact sync failed' }, { status: 500 });
      await base44.entities.OnboardingClient.update(clientId, { google_contact_resource: data.resourceName });
      return Response.json({ ok: true, resourceName: data.resourceName });
    }

    // ── AI Assist ──
    if (action === 'aiAssist') {
      const prompt = String(body.prompt || '');
      const context = body.context || {};
      if (!prompt) return Response.json({ error: 'Prompt required.' }, { status: 400 });

      const systemContext = `You are an AI onboarding assistant for Strategic Minds AI, a business growth and AI transformation agency.
Context about the client:
- Company: ${context.company_name || 'N/A'}
- Contact: ${context.contact_name || 'N/A'}
- Service: ${context.service_type || 'N/A'}
- Contract Value: $${context.contract_value || 'N/A'}
- Status: ${context.onboarding_status || 'N/A'}
- Industry: ${context.industry || 'N/A'}
- Website: ${context.website || 'N/A'}

Provide actionable, professional advice to help the onboarding team. Be concise, specific, and strategic. Focus on practical next steps and risk mitigation.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemContext}\n\nRequest: ${prompt}`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Brief summary of the situation' },
            recommendations: { type: 'array', items: { type: 'string' }, description: 'Specific actionable recommendations' },
            risk_flags: { type: 'array', items: { type: 'string' }, description: 'Potential risks or concerns' },
            next_steps: { type: 'array', items: { type: 'string' }, description: 'Immediate next steps' }
          }
        }
      });

      return Response.json({ ok: true, analysis: result });
    }

    return Response.json({ error: 'Action not implemented.' }, { status: 400 });
  } catch (error) {
    console.error('Onboarding workspace error:', error.message);
    return Response.json({ error: error.message || 'Onboarding operation failed.' }, { status: 500 });
  }
}