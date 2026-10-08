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
  const q = `contact_email=eq.${encodeURIComponent(email)}&select=*&order=created_date.desc&limit=1`;
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
      'release_approval',
      'client_delivery_email',
    ],
    delivery_email: answers.email || client.contact_email,
    provider_targets: { github: true, vercel_preview: true, supabase: true, drive: true },
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
  const completed = !missing || turn.completed === true;
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
      approval_mode: 'review_required',
      analytics_loop: true,
      engagement_mode: 'draft_or_policy_scoped_only',
    }),
  }))?.[0];
  return jsonResponse({ ok: true, status: 'queued_for_review', job_id: job?.id || null });
}

export async function handleClientFactory(path, request) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405);
  if (path === '/client-factory/token') return issueClientToken(request);
  if (path === '/client-factory/chat') return chatWithEden(request);
  if (path === '/client-factory/batch') return enqueueFactoryBatch(request);
  if (path === '/client-factory/social') return enqueueSocial(request);
  return jsonResponse({ error: 'Unknown client factory route' }, 404);
}
