import http from 'node:http';
import { createHash } from 'node:crypto';
import { buildGoogleVerifier, configuredGoogleClientId } from './google-auth.mjs';

const id = configuredGoogleClientId();
const allow = (process.env.OPERATOR_EMAIL_ALLOWLIST || '').split(',').map(x => x.trim()).filter(Boolean);
let verifier = null;
try { verifier = buildGoogleVerifier({ clientId: id, allowedEmails: allow }); }
catch { /* readiness stays false; no unauthenticated fallback */ }
const hash = s => createHash('sha256').update(s).digest('hex');
function send(res, status, obj) {
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' });
  res.end(JSON.stringify(obj));
}
export function createCommandGateway({ auth = verifier, maxBodyBytes = 16384 } = {}) {
  return http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      return send(res, 200, { service:'smai-v2-independent-command-gateway', base44RuntimeDependency:false, readyForAuthenticatedPlans:Boolean(auth), x1QueueWriteEnabled:false, productionEnabled:false });
    }
    if (req.method !== 'POST' || req.url !== '/v1/mission/plan') return send(res, 404, { error:'Not found' });
    if (!auth) return send(res, 503, { error:'Auth configuration incomplete' });
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ') || authHeader.length > 12200) return send(res, 401, { error:'Bearer Google ID token required' });
    try {
      // Authenticate BEFORE accepting or processing a mission payload.
      const actor = await auth(authHeader.slice(7));
      let raw = '';
      for await (const chunk of req) {
        raw += chunk.toString('utf8');
        if (Buffer.byteLength(raw, 'utf8') > maxBodyBytes) return send(res, 413, { error:'Body too large' });
      }
      const p = JSON.parse(raw);
      if (!p || typeof p !== 'object' || Array.isArray(p) ||
        typeof p.instruction !== 'string' || p.instruction.trim().length < 10 || p.instruction.length > 12000 ||
        typeof p.project_id !== 'string' || !/^[a-zA-Z0-9_-]{4,100}$/.test(p.project_id)) return send(res, 400, { error:'Typed project_id and instruction required' });
      if (p.production === true || p.release === true || p.spend_usd > 0 || p.override_approvals === true)
        return send(res, 403, { error:'Protected execution is not available from this endpoint' });
      const source = { project_id:p.project_id, instruction_sha256:hash(p.instruction.trim()), actor_sub_sha256:hash(actor.sub) };
      const missionId = 'smai_v2_' + hash(JSON.stringify(source)).slice(0,40);
      return send(res, 200, { mission_id:missionId, state:'PLANNED', actor_scope:'authorized_operator', project_id:p.project_id,
        source_sha256:source.instruction_sha256,
        required_steps:['resolve_source_truth','validate_auth_and_tenant','create_sandbox_artifact','independent_validation','operator_release_gate'],
        side_effects:false, queue_dispatched:false, base44RuntimeDependency:false, production_authorized:false });
    } catch { return send(res, 401, { error:'Request rejected by authentication or mission policy' }); }
  });
}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const port = Number(process.env.PORT || 3000);
  createCommandGateway().listen(port, '0.0.0.0');
}
