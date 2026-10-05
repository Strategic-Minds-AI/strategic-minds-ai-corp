import { createClientFromRequest } from '../../shared/ownedClient.ts';

const CLIENT_PROJECTS_ROOT = '1z7VW05UNwpX-6qZLCL2v0rE_LRqZi-U_';
const PROJECT_SUBFOLDERS = [
  '00 Source Truth',
  '01 Builder Docs',
  '02 Active Builds',
  '03 Bridge Receipts',
  '04 Social Systems',
  '05 Client Delivery',
  '06 Governance',
];

function safeFolderName(value, fallback) {
  const firstLine = String(value || '').split(/\r?\n/).map(part => part.trim()).find(Boolean) || '';
  const normalized = firstLine
    .replace(/^business(?:\s+name)?\s*:\s*/i, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\\/\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return normalized || fallback;
}

function driveQuery(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function provisionClientWorkspace(base44, intake) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
  if (!accessToken) throw new Error('Google Drive connection is unavailable.');

  const drive = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${accessToken}`, ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Drive request failed.');
    return data;
  };

  const ensureFolder = async (parent, name) => {
    const q = new URLSearchParams({
      q: `'${driveQuery(parent)}' in parents and name = '${driveQuery(name)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: '10',
    });
    const found = await drive(`https://www.googleapis.com/drive/v3/files?${q}`);
    if (found.files?.length) return { folder: found.files[0], created: false };
    const folder = await drive('https://www.googleapis.com/drive/v3/files?fields=id,name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parent],
      }),
    });
    return { folder, created: true };
  };

  const businessName = safeFolderName(intake.business, `Client ${intake.id.slice(0, 8)}`);
  const root = await ensureFolder(CLIENT_PROJECTS_ROOT, `CLIENT - ${businessName}`);
  const subfolders = {};
  for (const name of PROJECT_SUBFOLDERS) {
    subfolders[name] = (await ensureFolder(root.folder.id, name)).folder.id;
  }

  const intakeFileName = `CLIENT INTAKE - ${intake.id}.md`;
  const sourceTruth = subfolders['00 Source Truth'];
  const existingQuery = new URLSearchParams({
    q: `'${driveQuery(sourceTruth)}' in parents and name = '${driveQuery(intakeFileName)}' and trashed = false`,
    fields: 'files(id,name,webViewLink)',
    pageSize: '1',
  });
  const existing = await drive(`https://www.googleapis.com/drive/v3/files?${existingQuery}`);
  let intakeFile = existing.files?.[0];

  if (!intakeFile) {
    const content = [
      '# Strategic Minds AI Client Intake',
      '',
      `Intake ID: ${intake.id}`,
      `Captured: ${new Date().toISOString()}`,
      '',
      '## 1. Business name + website / social links',
      intake.business,
      '',
      '## 2. Products / services',
      intake.products_services,
      '',
      '## 3. Location / service area',
      intake.location_service_area,
      '',
      '## 4. Ideal customer + primary goal',
      intake.ideal_customer_goal,
      '',
      '## 5. Preferred visual style + examples',
      intake.preferred_visual_style,
      '',
      '## Workflow',
      'ONBOARD -> PUBLIC BUSINESS ENRICHMENT -> CLIENT INTELLIGENCE PROFILE -> CREATIVE DIRECTIONS -> CLIENT SELECTION -> MOCKUP LOCK -> BUILD -> PREVIEW -> INDEPENDENT VALIDATION -> APPROVAL GATE',
      '',
    ].join('\n');

    const boundary = `sm-intake-${crypto.randomUUID()}`;
    const metadata = {
      name: intakeFileName,
      parents: [sourceTruth],
      mimeType: 'text/markdown',
      appProperties: { strategic_minds_intake_id: intake.id },
    };
    const body = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: text/markdown; charset=UTF-8\r\n\r\n${content}\r\n`,
      `--${boundary}--`,
    ].join('');

    intakeFile = await drive('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  return {
    folderId: root.folder.id,
    folderUrl: `https://drive.google.com/drive/folders/${encodeURIComponent(root.folder.id)}`,
    intakeFileId: intakeFile.id,
    created: root.created,
  };
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const raw = await req.text();
    if (raw.length > 10000) return Response.json({ error: 'Submission too large' }, { status: 413 });
    const body = JSON.parse(raw);
    if (body.company_url) return Response.json({ ok: true });

    const { id, form_type } = body;
    const business = typeof body.business === 'string' ? body.business.trim() : '';
    const products_services = typeof body.products_services === 'string' ? body.products_services.trim() : '';
    const location_service_area = typeof body.location_service_area === 'string' ? body.location_service_area.trim() : '';
    const ideal_customer_goal = typeof body.ideal_customer_goal === 'string' ? body.ideal_customer_goal.trim() : '';
    const preferred_visual_style = typeof body.preferred_visual_style === 'string' ? body.preferred_visual_style.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '');
    const isOnboarding = form_type === 'client_onboarding';
    const onboardingFields = [business, products_services, location_service_area, ideal_customer_goal, preferred_visual_style];
    const onboardingValid = isOnboarding && onboardingFields.every(value => value.length >= 2 && value.length <= 5000);
    const isStandard = ['newsletter', 'contact'].includes(form_type);
    const standardValid =
      isStandard &&
      Boolean(name) &&
      name.length <= 120 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      email.length <= 254 &&
      message.length <= 5000 &&
      (form_type !== 'contact' || message.length >= 6);

    if (!validId || (!onboardingValid && !standardValid)) {
      return Response.json(
        { error: isOnboarding ? 'Please complete all five onboarding questions.' : 'Please check your name, email, and message.' },
        { status: 400 },
      );
    }

    // Intentionally public intake: insert-only. No stored answer content is returned to the caller.
    const base44 = createClientFromRequest(req);
    let existingLead = await base44.asServiceRole.entities.Lead.get(id);
    if (!existingLead) {
      existingLead = await base44.asServiceRole.entities.Lead.create(
        isOnboarding
          ? {
              id,
              form_type,
              business,
              products_services,
              location_service_area,
              ideal_customer_goal,
              preferred_visual_style,
              provisioning_status: 'pending',
            }
          : { id, form_type, name, email, message },
      );
    }

    let projectWorkspaceStatus = existingLead?.provisioning_status || 'not_required';
    if (isOnboarding && projectWorkspaceStatus !== 'ready') {
      try {
        const workspace = await provisionClientWorkspace(base44, {
          id,
          business,
          products_services,
          location_service_area,
          ideal_customer_goal,
          preferred_visual_style,
        });
        await base44.asServiceRole.entities.Lead.update(id, {
          provisioning_status: 'ready',
          drive_folder_id: workspace.folderId,
          drive_folder_url: workspace.folderUrl,
          intake_source_file_id: workspace.intakeFileId,
          provisioning_error: '',
        });
        projectWorkspaceStatus = 'ready';
      } catch (driveError) {
        console.error('Client workspace provisioning failed:', driveError.message);
        await base44.asServiceRole.entities.Lead.update(id, {
          provisioning_status: 'failed',
          provisioning_error: 'Drive project workspace could not be created automatically.',
        });
        projectWorkspaceStatus = 'failed';
      }
    }

    if (standardValid && name && email) {
      try {
        const existing = await base44.asServiceRole.entities.CrmContact.filter({ source_id: id });
        if (!existing.length) {
          await base44.asServiceRole.entities.CrmContact.create({
            name,
            email,
            notes: message || (form_type === 'newsletter' ? 'Newsletter signup' : ''),
            source: form_type === 'newsletter' ? 'Newsletter signup' : 'Website contact form',
            source_id: id,
            status: 'new',
            follow_up_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            follow_up_subject: 'Following up from Strategic Minds AI',
            follow_up_body: `Hi ${name.split(' ')[0]},\n\nThank you for reaching out to Strategic Minds AI. I wanted to follow up on your inquiry and see if a short strategy conversation would be helpful. You can reach us directly at +1 772-209-0266, or reply with a good time to connect.\n\nBest,\nStrategic Minds AI`,
            follow_up_status: 'paused',
          });
        }
      } catch (crmError) {
        console.error('CRM intake failed:', crmError.message);
      }
    }

    return Response.json({ ok: true, project_workspace_status: projectWorkspaceStatus });
  } catch (error) {
    console.error('Lead submission failed:', error.message);
    return Response.json({ error: 'We could not save your details. Please try again.' }, { status: 500 });
  }
}
