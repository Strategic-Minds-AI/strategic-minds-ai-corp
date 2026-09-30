import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { githubClient } from '../../shared/automation/github.ts';
import { automationStatus, installAutomation, controlAutomation } from '../../shared/automation/install.ts';
import { authorizeLiveRelease } from '../../shared/automation/releaseConsent.ts';
export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    let user; try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Admin sign-in required.' }, { status: 403 }); }
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const raw = await req.text(); if (raw.length > 1000) return Response.json({ error: 'Request too large.' }, { status: 413 });
    const body = JSON.parse(raw);
    if (!body || Array.isArray(body) || !['status','install','enable','pause','run','authorizeLive'].includes(body.action) || Object.keys(body).some(key => !['action','approved'].includes(key))) return Response.json({ error: 'Choose a supported coding-system action; repository, code and scores cannot be supplied by callers.' }, { status: 400 });
    if (body.action !== 'status' && body.approved !== true) return Response.json({ error: 'Explicit operator approval is required.' }, { status: 403 });
    const get = await githubClient(base44);
    if (body.action === 'authorizeLive') await authorizeLiveRelease(get, user);
    const result = ['status', 'authorizeLive'].includes(body.action) ? await automationStatus(get) : body.action === 'install' ? await installAutomation(get) : await controlAutomation(get, body.action);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Benchmark coding operation failed:', error.message);
    return Response.json({ error: error.message || 'Coding operation failed; no validation credit awarded.' }, { status: [403, 409, 429].includes(error.status) ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
  }
}