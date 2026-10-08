import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { requireUser } from './auth.mjs';
import { databaseRequest } from './database.mjs';
import { callAIGateway } from './gateway.mjs';
import { notConfigured } from './runtime.mjs';

const FIELDS = ['first_name','address','phone','email','business_stage','business','vision','colors','special_requests'];
const QUESTIONS = {
  first_name: "Hi, I’m Eden Skye, Strategic Minds AI’s AI client concierge. What should I call you?",
  address: "Nice to meet you. What address should we use for your project record?",
  phone: "What’s the best phone number for you?",
  email: "And the best email address?",
  business_stage: "Do you already have a business, are you starting one, or are we taking an existing business to a much bigger stage?",
  business: "Tell me the business name and what you sell or do.",
  vision: "If you could design the website with no technical limits, what would it look and feel like?",
  colors: "Any favorite colors, or colors I should absolutely avoid?",
  special_requests: "Last one. Any special requests, other than making me look good on the homepage? I’m kidding. Mostly.",
};

function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}
function clean(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}
function onboardingSecret() {
  const value = process.env.CLIENT_ONBOARDING_TOKEN_SECRET;
  if (!value) throw notConfigured('CLIENT_ONBOARDING_TOKEN_SECRET');
  return value;
}
function b64url(value) {
  return Buffer.from(value).toString('base64url');
}
function issueTokenPayload(payload) {
  const encoded = b64url(JSON.stringify(payload));
  const signature = createHmac('sha256', onboardingSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}
function verifyToken(token) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) throw Object.assign(new Error('Invalid onboarding link'), { status: 401 });
  const expected = createHmac('sha256', onboardingSecret()).update(encoded).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw Object.assign(new Error('Invalid onboarding link'), { status: 401 });
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  if (!payload.exp || Date.now() > payload.exp) throw Object.assign(new Error('This onboarding link has expired'), { status: 401 });
  return payload;
}
async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function queryRows(table, query) {
  return readJson(await databaseRequest(`/rest/v1/${table}?${query}`, { service: true }));
}
async function insertRows(table, data) {
  return readJson(await databaseRequest(`/rest/v1/${table}`, {
    service: true,
    method: 'POST',
    data,
    headers: { Prefer: 'return=representation' },
  }));
}
async function updateRows(table, query, data) {
  return readJson(await databaseRequest(`/rest/v1/${table}?${query}`, {
    service: true,
    method: 'PATCH',
    data,
    headers: { Prefer: 'return=representation' },
  }));
}
function normalizeAnswers(raw = {}, tokenPayload = {}) {
  const out = {};
  for (const field of FIELDS) out[field] = clean(raw[field], field === 'vision' || field === 'special_requests' ? 5000 : 1000);
  if (!out.email && tokenPayload.email) out.email = clean(tokenPayload.email, 254);
  if (!out.first_name && tokenPayload.name) out.first_name = clean(tokenPayload.name, 160);
  return out;
}
function nextMissing(answers) {
  return FIELDS.find((field) => !clean(answers[field])) || '';
}
function deterministicTurn(answers, first = false) {
  const field = nextMissing(answers);
  if (!field) return { reply: "Perfect. I have enough to prepare your website directions and start the build packet.", next_field: '', completed: true, extracted: {} };
  return { reply: first ? QUESTIONS[field] : QUESTIONS[field], next_field: field, completed: false, extracted: {} };
}
async function findClient(email) {
  const q = `contact_email=eq.${encodeURIComponent(email)}&select=*&order=created_at.desc&limit=1`;
  return (await queryRows('onboarding_clients', q))?.[0] || null;
}
function notesPayload(existing, answers, transcript, tokenPayload) {
  let parsed = {};
  try { parsed = existing ? JSON.parse(existing) : {}; } catch {}
  return JSON.stringify({
    ...parsed,
    eden_intake_v1: {
      answers,
      transcript: transcript.slice(-40),
      token_meta: {
        order_id: tokenPayload.order_id || '',
        source: tokenPayload.source || 'secure_onboarding_link',
      },
      updated_at: new Date().toISOString(),
    },
  });
}
async function persistClient(client, answers, transcript, tokenPayload) {
  const record = {
    company_name: answers.business || client?.company_name || 'Pending onboarding',
    contact_name: answers.first_name || tokenPayload.name || client?.contact_name || '',
    contact_email: answers.email || tokenPayload.email,
    contact_phone: answers.phone || client?.contact_phone || '',
    service_type: client?.service_type || 'AI Website + Growth System',
    onboarding_status: 'Onboarding',
    source: client?.source || 'Inbound',
    ai_summary: [
      answers.business_stage && `Stage: ${answers.business_stage}`,
      answers.vision && `Vision: ${answers.vision}`,
      answers.colors && `Colors: ${answers.colors}`,
    ].filter(Boolean).join('\n').slice(0, 2000),
    notes: notesPayload(client?.notes, answers, transcript, tokenPayload),
  };
  if (!client) return (await insertRows('onboarding_clients', record))?.[0];
  return (await updateRows('onboarding_clients', `id=eq.${encodeURIComponent(client.id)}`, record))?.[0] || client;
}
async function ensureBuildQueued(client, answers) {
  const existingBuild = (await queryRows('build_projects', `business_id=eq.${encodeURIComponent(client.id)}&select=*&order=created_date.desc&limit=1`))?.[0];
  const build = existingBuild || (await insertRows('build_projects', {
    business_id: client.id,
    business_name: answers.business || client.company_name,
    approved_concept: 'eden-intake-v1',
    generator_chain: ['research','visual_directions','website','qa','preview'],
    status: 'composed',
  }))?.[0];
  if (!build) throw new Error('Could not create build project');

  const key = `client:${client.id}:website:v1`;
  const existingJob = (await queryRows('generation_jobs', `idempotency_key=eq.${encodeURIComponent(key)}&select=*&limit=1`))?.[0];
  if (existingJob) return { build, job: existingJob, created: false };

  const input = {
    client_id: client.id,
    build_id: build.id,
    business_name: answers.business || client.company_name,
    onboarding: answers,
    pipeline: [
      'research_dossier',
      'generate_10_visual_directions',
      'await_visual_selection',
      'compile_web_pack',
      'build_preview',
      'independent_validation',
      'drive_sync',
      'prepare_release_candidate',
    ],
    next_protected_gates: ['release_approval', 'client_delivery_email'],
    delivery_email: answers.email || client.contact_email,
    provider_targets: { github: true, vercel_preview: true, supabase: true, drive: true },
    agent_route: [
      'Swarm Orchestrator & Copilot',
      'Brand & Creative Specialist',
      'Code Generation & Website Builder',
      'QA & Validation Agent',
      'Infrastructure Provisioning Specialist',
    ],
    live_release_requires_approval: true,
  };
  const job = (await insertRows('generation_jobs', {
    build_id: build.id,
    generator_id: 'apex',
    job_type: 'client_website_pipeline',
    idempotency_key: key,
    status: 'queued',
    input_ref: JSON.stringify(input),
    attempt_count: 0,
  }))?.[0];
  return { build, job, created: true };
}
async function aiTurn(answers, message, currentField, transcript) {
  const schema = {
    type: 'object',
    required: ['reply','next_field','completed','extracted'],
    properties: {
      reply: { type: 'string' },
      next_field: { type: 'string' },
      completed: { type: 'boolean' },
      extracted: {
        type: 'object',
        properties: Object.fromEntries(FIELDS.map((field) => [field, { type: 'string' }])),
        required: FIELDS,
      },
    },
  };
  const system = `You are Eden Skye, Strategic Minds AI's clearly disclosed AI client concierge.
Be intelligent, warm, concise, confident, lightly playful, and professional. Never pretend to be human.
Complete these onboarding fields in order: ${FIELDS.join(', ')}.
Ask one main question at a time. Keep each reply under 55 words. Extract any fields the user already answered.
Do not claim an email, website, deployment, text message, payment, or external action happened unless the runtime says it happened.
When all fields are complete, say you have enough to prepare ten website directions and the build packet.`;
  try {
    const result = await callAIGateway({
      system,
      prompt: JSON.stringify({ answers, current_field: currentField, user_message: message, recent_transcript: transcript.slice(-10) }),
      jsonSchema: schema,
      maxTokens: 700,
      temperature: 0.5,
    });
    return result.json;
  } catch {
    return deterministicTurn(answers, false);
  }
}
async function issueClientToken(request) {
  const user = await requireUser(request, true);
  const body = await request.json();
  const email = clean(body.email, 254);
  if (!email || !email.includes('@')) return jsonResponse({ error: 'Valid client email is required' }, 400);
  const ttlHours = Math.min(Math.max(Number(body.ttl_hours || 336), 1), 24 * 30);
  const payload = {
    email,
    name: clean(body.name, 160),
    order_id: clean(body.order_id, 160),
    source: clean(body.source || 'admin', 80),
    issued_by: user.email,
    iat: Date.now(),
    exp: Date.now() + ttlHours * 3600 * 1000,
    nonce: randomUUID(),
  };
  return jsonResponse({ ok: true, token: issueTokenPayload(payload), expires_at: new Date(payload.exp).toISOString() });
}
async function chatWithEden(request) {
  const body = await request.json();
  const tokenPayload = verifyToken(body.token);
  let answers = normalizeAnswers(body.answers, tokenPayload);
  const transcript = Array.isArray(body.transcript) ? body.transcript.slice(-30) : [];
  const message = clean(body.message, 1600);
  const currentField = clean(body.current_field || nextMissing(answers), 80);

  let turn;
  if (!message) {
    turn = deterministicTurn(answers, true);
  } else {
    transcript.push({ role: 'user', content: message });
    if (currentField && FIELDS.includes(currentField)) answers[currentField] = clean(message, currentField === 'vision' || currentField === 'special_requests' ? 5000 : 1000);
    turn = await aiTurn(answers, message, currentField, transcript);
    for (const field of FIELDS) {
      const value = clean(turn.extracted?.[field], field === 'vision' || field === 'special_requests' ? 5000 : 1000);
      if (value) answers[field] = value;
    }
  }

  const missing = nextMissing(answers);
  const completed = !missing;
  const reply = clean(turn.reply || (completed ? 'Perfect. I have everything I need.' : QUESTIONS[missing]), 1200);
  transcript.push({ role: 'assistant', content: reply });

  const existing = await findClient(tokenPayload.email);
  const client = await persistClient(existing, answers, transcript, tokenPayload);
  let queue = null;
  if (completed) queue = await ensureBuildQueued(client, answers);

  return jsonResponse({
    ok: true,
    reply,
    next_field: completed ? '' : (FIELDS.includes(turn.next_field) ? turn.next_field : missing),
    completed,
    answers,
    client_id: client?.id,
    build_queued: Boolean(queue),
    build_id: queue?.build?.id || null,
    job_id: queue?.job?.id || null,
  });
}
async function enqueueFactoryBatch(request) {
  await requireUser(request, true);
  const body = await request.json();
  const targets = Array.isArray(body.targets) ? body.targets : [];
  if (!targets.length) return jsonResponse({ error: 'targets[] is required' }, 400);
  if (targets.length > 1000) return jsonResponse({ error: 'Maximum 1000 targets per enqueue request. Use deterministic chunking for larger runs.' }, 400);
  const batchId = clean(body.batch_id, 120) || `batch_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const jobs = targets.map((target, index) => {
    const normalized = typeof target === 'string' ? { business_name: target } : target || {};
    const signature = createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 20);
    return {
      generator_id: 'apex',
      job_type: 'website_factory_target',
      idempotency_key: `${batchId}:${index}:${signature}`,
      status: 'queued',
      attempt_count: 0,
      input_ref: JSON.stringify({
        batch_id: batchId,
        target: normalized,
        pipeline: ['research','business_genome','visual_system','web_pack','build','validate','preview'],
        agent_route: [
          'Swarm Orchestrator & Copilot',
          'Brand & Creative Specialist',
          'Code Generation & Website Builder',
          'QA & Validation Agent',
        ],
        release_mode: 'preview_only',
        production_requires_approval: true,
      }),
    };
  });
  const created = await insertRows('generation_jobs', jobs);
  return jsonResponse({ ok: true, batch_id: batchId, queued: created?.length || 0, status: 'queued', note: 'Queued work is not a completed or deployed website.' });
}
async function enqueueSocial(request) {
  await requireUser(request, true);
  const body = await request.json();
  if (body.live_publish === true) return jsonResponse({ error: 'Live publishing requires an approved channel/content policy envelope. This endpoint only creates review-ready work.' }, 409);
  const brief = clean(body.brief, 5000);
  if (!brief) return jsonResponse({ error: 'brief is required' }, 400);
  const networks = Array.isArray(body.networks) ? body.networks.map((v) => clean(v, 40)).filter(Boolean) : [];
  const idempotency = clean(body.idempotency_key, 180) || `social:${createHash('sha256').update(JSON.stringify({brief,networks,schedule_at:body.schedule_at || ''})).digest('hex').slice(0, 32)}`;
  const job = (await insertRows('generation_jobs', {
    generator_id: 'social-operator',
    job_type: 'social_content_pipeline',
    idempotency_key: idempotency,
    status: 'queued',
    attempt_count: 0,
    input_ref: JSON.stringify({
      brief,
      networks,
      schedule_at: clean(body.schedule_at, 80),
      asset_modes: ['image','carousel','short_video'],
      video_provider: 'heygen',
      scheduler_provider: 'metricool',
      agent_route: [
        'Swarm Orchestrator & Copilot',
        'Brand & Creative Specialist',
        'QA & Validation Agent',
      ],
      approval_mode: 'review_required',
      analytics_loop: true,
      engagement_mode: 'draft_or_policy_scoped_only',
    }),
  }))?.[0];
  return jsonResponse({ ok: true, status: 'queued_for_review', job_id: job?.id || null });
}

function workerSecret() {
  const value = process.env.FACTORY_WORKER_TOKEN;
  if (!value) throw notConfigured('FACTORY_WORKER_TOKEN');
  return value;
}
function requireWorker(request) {
  const auth = request.headers.get('Authorization') || '';
  const supplied = auth.replace(/^Bearer\s+/i, '');
  const expected = workerSecret();
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (!supplied || a.length !== b.length || !timingSafeEqual(a, b)) {
    throw Object.assign(new Error('Unauthorized worker'), { status: 401 });
  }
}
async function claimFactoryJob(request) {
  requireWorker(request);
  const body = await request.json().catch(() => ({}));
  const allowedTypes = Array.isArray(body.job_types)
    ? body.job_types.map((v) => clean(v, 80)).filter(Boolean).slice(0, 20)
    : [];

  const staleBefore = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await updateRows(
    'generation_jobs',
    `status=eq.running&started_at=lt.${encodeURIComponent(staleBefore)}`,
    {
      status: 'dead_letter',
      error: 'Worker lease expired. Manual review required before replaying possible side effects.',
      finished_at: new Date().toISOString(),
    }
  ).catch(() => null);

  let query = 'status=eq.queued&select=*&order=created_date.asc&limit=10';
  if (allowedTypes.length) {
    query += `&job_type=in.(${allowedTypes.map((v) => encodeURIComponent(v)).join(',')})`;
  }
  const candidates = await queryRows('generation_jobs', query);
  for (const job of candidates || []) {
    if (job.next_attempt_at && new Date(job.next_attempt_at).getTime() > Date.now()) continue;
    const attemptCount = Number(job.attempt_count || 0) + 1;
    if (attemptCount > 3) {
      await updateRows('generation_jobs', `id=eq.${encodeURIComponent(job.id)}&status=eq.queued`, {
        status: 'dead_letter',
        error: 'Maximum attempt count exceeded before claim.',
        finished_at: new Date().toISOString(),
      });
      continue;
    }
    const claimed = await updateRows(
      'generation_jobs',
      `id=eq.${encodeURIComponent(job.id)}&status=eq.queued`,
      {
        status: 'running',
        attempt_count: attemptCount,
        started_at: new Date().toISOString(),
        error: null,
      }
    );
    const row = claimed?.[0];
    if (!row) continue;
    let input = {};
    try { input = JSON.parse(row.input_ref || '{}'); } catch {}
    return jsonResponse({
      ok: true,
      claimed: true,
      job: {
        id: row.id,
        build_id: row.build_id || null,
        generator_id: row.generator_id,
        job_type: row.job_type,
        attempt_count: row.attempt_count,
        idempotency_key: row.idempotency_key,
        input,
      },
    });
  }
  return jsonResponse({ ok: true, claimed: false, job: null });
}
async function recordFactoryReceipt(request) {
  requireWorker(request);
  const body = await request.json().catch(() => ({}));
  const jobId = clean(body.job_id, 120);
  if (!jobId) return jsonResponse({ error: 'job_id is required' }, 400);
  const job = (await queryRows('generation_jobs', `id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`))?.[0];
  if (!job) return jsonResponse({ error: 'Job not found' }, 404);
  if (job.status !== 'running') return jsonResponse({ error: `Job is not running (status=${job.status})` }, 409);

  const outcome = clean(body.outcome, 20).toLowerCase();
  const result = body.result && typeof body.result === 'object' ? body.result : {};
  const summary = clean(body.summary || result.summary, 3000);
  const error = clean(body.error, 4000);
  const now = new Date().toISOString();

  if (outcome === 'accepted') {
    await updateRows('generation_jobs', `id=eq.${encodeURIComponent(job.id)}&status=eq.running`, {
      output_ref: JSON.stringify(result).slice(0, 20000),
      result_summary: summary || 'External executor accepted the job',
      error: null,
    });
    return jsonResponse({
      ok: true,
      status: 'running',
      bridge_accepted: true,
      release_ready: false,
      release_requires_approval: true,
    });
  }

  if (outcome === 'failed' && body.retriable === true && Number(job.attempt_count || 0) < 3) {
    const delayMinutes = Math.min(30, Math.pow(2, Math.max(0, Number(job.attempt_count || 1) - 1)) * 2);
    const next = new Date(Date.now() + delayMinutes * 60000).toISOString();
    await updateRows('generation_jobs', `id=eq.${encodeURIComponent(job.id)}&status=eq.running`, {
      status: 'queued',
      output_ref: JSON.stringify(result).slice(0, 20000),
      result_summary: summary || 'Retriable failure',
      error: error || 'Worker reported a retriable failure',
      next_attempt_at: next,
      finished_at: null,
    });
    return jsonResponse({ ok: true, status: 'queued', next_attempt_at: next });
  }

  const finalStatus = outcome === 'failed' ? 'failed' : 'done';
  await updateRows('generation_jobs', `id=eq.${encodeURIComponent(job.id)}&status=eq.running`, {
    status: finalStatus,
    output_ref: JSON.stringify(result).slice(0, 20000),
    result_summary: summary || (finalStatus === 'done' ? 'Worker completed job' : 'Worker failed job'),
    error: finalStatus === 'failed' ? (error || 'Worker reported failure') : null,
    finished_at: now,
  });

  if (job.build_id) {
    const buildStatus = finalStatus === 'done' ? 'validated' : 'failed';
    await updateRows('build_projects', `id=eq.${encodeURIComponent(job.build_id)}`, {
      status: buildStatus,
      ...(result.preview_url ? { preview_url: clean(result.preview_url, 1000) } : {}),
    }).catch(() => null);
  }

  return jsonResponse({
    ok: true,
    status: finalStatus,
    release_ready: finalStatus === 'done',
    release_requires_approval: true,
  });
}


function verifyPreviewSelfTest(request) {
  if (process.env.VERCEL_ENV !== 'preview') {
    throw Object.assign(new Error('Preview self-test is disabled outside Vercel preview'), { status: 404 });
  }
  const url = new URL(request.url);
  const ts = Number(url.searchParams.get('ts') || 0);
  const nonce = clean(url.searchParams.get('nonce'), 120);
  const supplied = clean(url.searchParams.get('sig'), 256);
  if (!Number.isFinite(ts) || !nonce || !supplied || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
    throw Object.assign(new Error('Invalid or expired preview self-test signature'), { status: 401 });
  }
  const expected = createHmac('sha256', workerSecret()).update(String(ts) + ':' + nonce).digest('hex');
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw Object.assign(new Error('Invalid preview self-test signature'), { status: 401 });
  }
  return { ts, nonce };
}

async function runPreviewSelfTest(request) {
  const { nonce } = verifyPreviewSelfTest(request);
  const email = `synthetic.unified.factory.${nonce}@example.com`;
  const tokenPayload = {
    email,
    name: 'Alex Synthetic',
    order_id: `UFV1-${nonce}`,
    source: 'approved_preview_selftest',
    issued_by: 'unified-factory-preview-selftest',
    iat: Date.now(),
    exp: Date.now() + 30 * 60 * 1000,
    nonce,
  };
  const token = issueTokenPayload(tokenPayload);
  let answers = normalizeAnswers({}, tokenPayload);
  let currentField = nextMissing(answers);
  const transcript = [];
  const turns = [
    ['address', '100 Test Harbor Drive, Fort Lauderdale, FL 33301'],
    ['phone', '954-555-0108'],
    ['business_stage', 'Existing business ready to scale with a new digital presence.'],
    ['business', 'Harbor Peak Roofing, a synthetic South Florida roofing company for preview validation only.'],
    ['vision', 'Modern premium local-service website with immediate trust, emergency-response CTA, strong project imagery, concise service sections, financing and estimate conversion paths.'],
    ['colors', 'Deep navy, clean white, electric cyan accents. Avoid orange and brown.'],
    ['special_requests', 'Use clearly synthetic testimonials and project examples, strong mobile call-to-action, FAQ, service-area section, and no production publishing.'],
  ];
  let last = null;

  const invoke = async (message, field) => {
    const syntheticRequest = new Request('https://preview.internal/api/runtime/client-factory/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        message,
        current_field: field,
        answers,
        transcript,
      }),
    });
    const response = await chatWithEden(syntheticRequest);
    const body = await response.json();
    if (!response.ok) throw Object.assign(new Error(body.error || 'Synthetic Eden turn failed'), { status: response.status });
    answers = body.answers || answers;
    currentField = body.next_field || '';
    if (message) transcript.push({ role: 'user', content: message });
    transcript.push({ role: 'assistant', content: body.reply || '' });
    last = body;
    return body;
  };

  await invoke('', currentField);
  for (const [field, message] of turns) {
    await invoke(message, field);
  }

  if (!last?.completed || !last?.job_id || !last?.build_id || !last?.client_id) {
    throw new Error('Synthetic Eden pipeline did not reach queued build state');
  }

  return jsonResponse({
    ok: true,
    synthetic: true,
    email,
    completed: last.completed,
    client_id: last.client_id,
    build_id: last.build_id,
    job_id: last.job_id,
    next: 'ZERO_BRIDGE_ACCEPTANCE',
    production_mutation: false,
    customer_messages_sent: false,
    live_publish: false,
  });
}

export async function handleClientFactory(path, request) {
  if (path === '/client-factory/selftest') return runPreviewSelfTest(request);
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405);
  if (path === '/client-factory/token') return issueClientToken(request);
  if (path === '/client-factory/chat') return chatWithEden(request);
  if (path === '/client-factory/batch') return enqueueFactoryBatch(request);
  if (path === '/client-factory/social') return enqueueSocial(request);
  if (path === '/client-factory/worker/claim') return claimFactoryJob(request);
  if (path === '/client-factory/worker/receipt') return recordFactoryReceipt(request);
  return jsonResponse({ error: 'Unknown client factory route' }, 404);
}
