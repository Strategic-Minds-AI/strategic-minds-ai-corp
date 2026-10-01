# Railway Multi-Agent Sandbox Platform

## Authority
Project: `15f90272-e2f6-4739-8286-91447f545d71`  
Staging environment: `d829fb35-5cdf-47a2-bd4f-134a1cf336d4`

## Runtime model
- Persistent Railway **environments**: one per long-running agent plus shared staging.
- Ephemeral Railway **Sandboxes**: disposable Linux VMs for build/test/code execution.
- Local workers: same Base44 task/auth protocol running on JARVIS.
- Base44 is the admin/control adapter; GitHub is code source truth.

## Persistent environment names
- sandbox-orchestrator
- sandbox-growth
- sandbox-code
- sandbox-social
- sandbox-sales
- sandbox-brand
- sandbox-replicator
- sandbox-swarm

Create persistent agent environments by cloning the validated staging environment with Railway's Public GraphQL API `environmentCreate(sourceEnvironmentId: ...)`.

## Worker
`worker/` contains the minimal Node.js 22 worker. It:
- exposes `GET /health`;
- polls Base44 `sandboxAuth`;
- reports success/failure;
- heartbeats;
- handles SIGTERM/SIGINT;
- disables process execution unless `ALLOW_SHELL_TASKS=true`.

Non-secret defaults:
- `BASE44_SANDBOX_AUTH_URL=https://strategic-ai-consulting.base44.app/functions/sandboxAuth`
- `SANDBOX_RUNTIME=railway_environment`
- `POLL_INTERVAL_MS=5000`
- `HEARTBEAT_INTERVAL_MS=30000`
- `TASK_TIMEOUT_MS=600000`
- `ALLOW_SHELL_TASKS=false`

Secret values are never committed. `SANDBOX_API_KEY` must be bound through Railway/Base44 provider-native secret paths.

## Release order
1. Harden Base44 auth (hash keys, task ownership, leases).
2. Deploy one worker to staging.
3. Validate health/poll/report/heartbeat.
4. Clone staging to one canary agent environment.
5. Bind that agent's unique secret and `AGENT_NAME`.
6. Validate canary.
7. Roll out the remaining seven environments.
8. Use ephemeral Railway Sandboxes only for disposable task execution.
