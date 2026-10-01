import http from "node:http";
import { spawn } from "node:child_process";

const cfg = {
  endpoint: process.env.BASE44_SANDBOX_AUTH_URL || "https://strategic-ai-consulting.base44.app/functions/sandboxAuth",
  key: process.env.SANDBOX_API_KEY || "",
  agent: process.env.AGENT_NAME || "",
  runtime: process.env.SANDBOX_RUNTIME || "railway_environment",
  pollMs: Number(process.env.POLL_INTERVAL_MS || 5000),
  heartbeatMs: Number(process.env.HEARTBEAT_INTERVAL_MS || 30000),
  taskTimeoutMs: Number(process.env.TASK_TIMEOUT_MS || 600000),
  maxOutputBytes: Number(process.env.MAX_OUTPUT_BYTES || 262144),
  allowShell: String(process.env.ALLOW_SHELL_TASKS || "false").toLowerCase() === "true",
  httpAllowlist: String(process.env.HTTP_ALLOWLIST || "").split(",").map(v => v.trim()).filter(Boolean),
  port: Number(process.env.PORT || 3000),
};

if (!cfg.key || !cfg.agent) {
  console.error("Missing SANDBOX_API_KEY or AGENT_NAME");
  process.exit(1);
}

let stopping = false;
let activeChild = null;

async function callBackend(action, payload = {}) {
  const res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Backend ${res.status}: ${data.error || "request failed"}`);
  return data;
}

function parsePayload(task) {
  try { return task.description ? JSON.parse(task.description) : {}; }
  catch { return { text: task.description || "" }; }
}

function cap(text) {
  const b = Buffer.from(String(text ?? ""));
  return b.length <= cfg.maxOutputBytes ? b.toString() : b.subarray(0, cfg.maxOutputBytes).toString() + "\n[truncated]";
}

function assertAllowedUrl(url) {
  const u = new URL(url);
  if (!["https:", "http:"].includes(u.protocol)) throw new Error("Unsupported URL protocol");
  if (cfg.httpAllowlist.length && !cfg.httpAllowlist.includes(u.hostname)) {
    throw new Error(`Host not in HTTP_ALLOWLIST: ${u.hostname}`);
  }
  return u;
}

async function runHttp(task) {
  const p = parsePayload(task);
  const u = assertAllowedUrl(p.url);
  const res = await fetch(u, {
    method: p.method || "GET",
    headers: p.headers || {},
    body: p.body == null ? undefined : (typeof p.body === "string" ? p.body : JSON.stringify(p.body)),
    signal: AbortSignal.timeout(cfg.taskTimeoutMs),
  });
  return { type: "http_request", status: res.status, body: cap(await res.text()) };
}

async function runProcess(task) {
  if (!cfg.allowShell) throw new Error("Shell execution is disabled for this worker");
  const p = parsePayload(task);
  if (!p.command || typeof p.command !== "string") throw new Error("command is required");
  const args = Array.isArray(p.args) ? p.args.map(String) : [];
  return await new Promise((resolve, reject) => {
    const child = spawn(p.command, args, {
      cwd: "/workspace",
      env: { ...process.env },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    activeChild = child;
    let stdout = "", stderr = "", finished = false;
    const timer = setTimeout(() => {
      if (!finished) child.kill("SIGTERM");
      setTimeout(() => { if (!finished) child.kill("SIGKILL"); }, 5000).unref();
    }, cfg.taskTimeoutMs);
    child.stdout.on("data", d => { stdout = cap(stdout + d); });
    child.stderr.on("data", d => { stderr = cap(stderr + d); });
    child.on("error", err => { clearTimeout(timer); activeChild = null; reject(err); });
    child.on("close", code => {
      finished = true; clearTimeout(timer); activeChild = null;
      if (code === 0) resolve({ type: "process", exitCode: code, stdout, stderr });
      else reject(new Error(`Process exited ${code}: ${stderr || stdout}`));
    });
  });
}

async function execute(task) {
  switch (task.task_type) {
    case "http_request": return runHttp(task);
    case "shell":
    case "process": return runProcess(task);
    case "noop": return { type: "noop", ok: true };
    default: return { type: "unhandled", ok: false, message: `Unsupported task_type: ${task.task_type}` };
  }
}

async function report(task, status, result) {
  return callBackend("report", {
    task_id: task.id,
    status,
    result,
    claim_token: task.claim_token || undefined,
  });
}

async function pollOnce() {
  const data = await callBackend("poll", { agent_name: cfg.agent, runtime: cfg.runtime });
  for (const task of data.tasks || []) {
    if (stopping) break;
    try {
      const result = await execute(task);
      if (result?.ok === false) await report(task, "failed", result);
      else await report(task, "completed", result);
    } catch (error) {
      await report(task, "failed", { error: String(error?.message || error) }).catch(() => {});
    }
  }
}

async function heartbeat() {
  try {
    await callBackend("heartbeat", {
      agent_name: cfg.agent,
      runtime: cfg.runtime,
      railway_environment_id: process.env.RAILWAY_ENVIRONMENT_ID || null,
      railway_service_id: process.env.RAILWAY_SERVICE_ID || null,
      railway_deployment_id: process.env.RAILWAY_DEPLOYMENT_ID || null,
    });
  } catch (error) {
    console.error("heartbeat_error", error.message);
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(stopping ? 503 : 200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: !stopping, agent: cfg.agent, runtime: cfg.runtime }));
    return;
  }
  res.writeHead(404).end();
});
server.listen(cfg.port, "0.0.0.0");

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log("shutdown", signal);
  server.close();
  if (activeChild) {
    activeChild.kill("SIGTERM");
    setTimeout(() => activeChild?.kill("SIGKILL"), 5000).unref();
  }
  await heartbeat();
  setTimeout(() => process.exit(0), 6000).unref();
}

for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => shutdown(signal));

setInterval(heartbeat, cfg.heartbeatMs).unref();
await heartbeat();

while (!stopping) {
  try { await pollOnce(); }
  catch (error) { console.error("poll_error", error.message); }
  await new Promise(r => setTimeout(r, cfg.pollMs));
}
