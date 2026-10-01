# Base44 Sandbox Auth v2 - proposed hardened contract

This is a design artifact only. Applying it changes authentication/schema and therefore requires an approved protected change.

## Problems in current live implementation
- Raw `sk_sbx_...` values are persisted in `Sandbox.api_key`.
- The UI can copy old raw keys after creation.
- A valid sandbox key can report against an arbitrary `task_id` unless ownership is checked.
- Poll/claim is not atomic, so multiple workers can race on the same AgentTask.
- Heartbeats do not persist worker liveness.

## Sandbox fields
Replace raw key storage with:
- `api_key_hash`: SHA-256 hex digest
- `key_prefix`: non-secret display prefix
- `auth_version`: e.g. `v2`
- `last_seen_at`
- `railway_service_id`
- `railway_sandbox_id`
- `runtime_kind`: `local | railway_environment | railway_sandbox`

Raw key lifecycle:
1. Generate 32 random bytes.
2. Prefix raw key with `sk_sbx_`.
3. Hash raw key with SHA-256.
4. Store only hash + display prefix.
5. Write raw key directly to the target worker secret `SANDBOX_API_KEY`.
6. Return raw key at most once if manual bootstrap is explicitly requested.
7. Never log or persist the raw value.

## AgentTask lease fields
Add:
- `claimed_by_sandbox_id`
- `claim_token`
- `claimed_at`
- `lease_expires_at`
- `attempt_count`
- `completed_at`

## Poll contract
A worker may only claim tasks where:
- `agent_name == sandbox.agent_name`
- `autonomous == true`
- status is `pending`, or an expired lease is recoverable.

Claim must atomically transition the task to `in_progress`, bind `claimed_by_sandbox_id`, and issue a random `claim_token`.

## Report contract
A report is accepted only when:
- sandbox auth is valid;
- task exists;
- `task.agent_name == sandbox.agent_name`;
- `task.claimed_by_sandbox_id == sandbox.id`;
- supplied `claim_token` matches;
- task is currently `in_progress`.

## Heartbeat contract
Update `Sandbox.last_seen_at` and runtime metadata. A reconciler marks a worker stale when heartbeat age exceeds policy.

## Delete/revoke
Deleting a sandbox:
1. Disable its Base44 record first.
2. Revoke/delete the worker secret binding.
3. Stop/delete Railway runtime.
4. Reconcile Railway state.
5. Preserve a metadata-only receipt.

Never store raw secret material in GitHub, Drive, logs, receipts, or chat.
