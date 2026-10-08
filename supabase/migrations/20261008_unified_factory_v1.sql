-- Strategic Minds Unified Factory V1
-- SAFE ARTIFACT ONLY: do not apply to production without explicit approval.

create unique index if not exists generation_jobs_idempotency_key_uidx
  on public.generation_jobs (idempotency_key)
  where idempotency_key is not null and idempotency_key <> '';

comment on index generation_jobs_idempotency_key_uidx is
  'Prevents duplicate autonomous factory jobs across retries and reconciler cycles.';
