/**
 * Railway Sandbox Worker
 * 
 * Standalone Node.js script that runs on Railway and polls the Strategic Minds AI
 * sandboxAuth endpoint for tasks, executes them, and reports results.
 * 
 * Environment variables:
 *   SANDBOX_API_KEY  - The sk_sbx_... API key for this sandbox (required)
 *   APP_URL          - The app URL (default: https://strategic-ai-consulting.base44.app)
 *   POLL_INTERVAL    - Poll interval in ms (default: 60000)
 *   MAX_CYCLES       - Max poll cycles before exit (default: 0 = infinite)
 * 
 * Deploy: node railwayWorker.js
 */

const SANDBOX_API_KEY = process.env.SANDBOX_API_KEY || process.env.WORKER_SECRET;
const APP_URL = (process.env.APP_URL || 'https://strategic-ai-consulting.base44.app').replace(/\/$/, '');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '60000', 10);
const MAX_CYCLES = parseInt(process.env.MAX_CYCLES || '0', 10);
const AUTH_ENDPOINT = `${APP_URL}/functions/sandboxAuth`;

if (!SANDBOX_API_KEY) {
  console.error('[FATAL] SANDBOX_API_KEY (or WORKER_SECRET) environment variable is required.');
  process.exit(1);
}

if (!SANDBOX_API_KEY.startsWith('sk_sbx_')) {
  console.error('[FATAL] SANDBOX_API_KEY must start with "sk_sbx_". Generate one from the Sandbox Manager UI.');
  process.exit(1);
}

let cycleCount = 0;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

async function apiCall(body) {
  const res = await fetch(AUTH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SANDBOX_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`sandboxAuth ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

async function heartbeat() {
  try {
    const data = await apiCall({ action: 'heartbeat' });
    if (data.ok) {
      consecutiveErrors = 0;
    }
    return data;
  } catch (e) {
    console.error(`[heartbeat] ${e.message}`);
    return null;
  }
}

async function pollAndExecute() {
  // 1. Poll for tasks
  const pollData = await apiCall({ action: 'poll' });
  const tasks = pollData.tasks || [];

  if (tasks.length === 0) {
    return;
  }

  console.log(`[cycle ${cycleCount}] Received ${tasks.length} task(s)`);

  // 2. Execute each task
  for (const task of tasks) {
    const startTime = Date.now();
    console.log(`[task] ${task.id} | ${task.task_type} | ${task.title}`);

    try {
      const execData = await apiCall({
        action: 'execute',
        task_id: task.id,
        claim_token: task.claim_token,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (execData.ok) {
        console.log(`[task] ${task.id} completed in ${elapsed}s | status: ${execData.status}`);
      } else {
        console.error(`[task] ${task.id} execute failed: ${execData.error}`);
      }
    } catch (e) {
      console.error(`[task] ${task.id} execute error: ${e.message}`);
      // Report failure back to sandboxAuth
      try {
        await apiCall({
          action: 'report',
          task_id: task.id,
          claim_token: task.claim_token,
          status: 'failed',
          result: JSON.stringify({ error: e.message }),
        });
      } catch (reportErr) {
        console.error(`[task] ${task.id} report-fail error: ${reportErr.message}`);
      }
    }
  }
}

async function runCycle() {
  cycleCount++;
  try {
    await heartbeat();
    await pollAndExecute();
    consecutiveErrors = 0;
  } catch (e) {
    consecutiveErrors++;
    console.error(`[cycle ${cycleCount}] error: ${e.message} (consecutive: ${consecutiveErrors})`);

    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`[FATAL] ${MAX_CONSECUTIVE_ERRORS} consecutive errors. Exiting.`);
      process.exit(1);
    }
  }

  if (MAX_CYCLES > 0 && cycleCount >= MAX_CYCLES) {
    console.log(`[done] Reached MAX_CYCLES (${MAX_CYCLES}). Exiting.`);
    process.exit(0);
  }
}

// Graceful shutdown
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[\${signal}] Shutting down gracefully...`);
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Main loop
console.log(`[boot] Sandbox worker started`);
console.log(`[boot] Endpoint: ${AUTH_ENDPOINT}`);
console.log(`[boot] Poll interval: ${POLL_INTERVAL}ms`);
console.log(`[boot] Max cycles: ${MAX_CYCLES || 'infinite'}`);

// Run first cycle immediately, then interval
runCycle();
const interval = setInterval(runCycle, POLL_INTERVAL);

// Keep the process alive
setInterval(() => {}, 1 << 30);