# Strategic Minds Unified Factory V1

Status: BRANCH / PREVIEW CANDIDATE  
Canonical branch: `unified-factory-base44-exit-v1`

## Objective

Remove Base44 from the critical runtime path and operate directly from Strategic Minds-owned infrastructure:

```
Client -> StrategicMindsAI.com -> Supabase -> durable queue -> APEX / workers
       -> GitHub -> Vercel Preview -> validation -> approval -> release
       -> Drive source truth -> delivery email
```

Base44 may remain temporarily as a donor/reference environment only. New critical-path work must not depend on Base44 credits or Base44-hosted runtime execution.

## Verified source state before this branch

- The corporate repository already contains a standalone Supabase/Vercel runtime and frontend adapters.
- `src/api/base44Client.js` is a legacy compatibility name; its current implementation routes to owned Supabase/runtime adapters instead of the Base44 SDK.
- Vercel project `strategic-minds-ai-corp` is linked to the GitHub repository.
- The current visual replacement branch has READY Vercel preview deployments.
- Supabase projects available to Strategic Minds are healthy.
- Metricool currently exposes one Strategic Minds brand: `thereal_edenskye` with Facebook, Instagram and TikTok connected.

## V1 direct workflow

1. Admin creates a secure client onboarding token.
2. Client opens `/start?t=<signed-token>`.
3. Eden Skye asks the onboarding questions.
4. Every turn is persisted to Supabase `onboarding_clients`.
5. Completion creates a `build_projects` row and one deterministic `generation_jobs` root job.
6. The root job carries this pipeline:
   - research dossier
   - 10 visual directions
   - visual selection gate
   - web pack compilation
   - preview build
   - independent validation
   - Drive sync
   - release approval
   - client delivery email
7. Production release and customer delivery remain evidence-gated.

## Simplified Digital Dominance

The new `/factory-lite` route queues real targets into the existing durable generation queue.

A single API request accepts at most 1,000 targets. Bigger runs must be chunked. Scale is controlled by:
- deterministic idempotency keys
- queues and leases
- provider rate limits
- concurrency budgets
- bounded retries and dead-letter handling
- staged load testing
- independent validation
- preview-before-production

Do not claim hundreds of thousands or millions of completed sites until throughput, cost, quality and provider limits are measured.

## Social OS

The new `/social-os` route creates review-ready social jobs.

Target loop:

```
brief -> content -> image/carousel -> video -> QA -> review/policy
      -> Metricool schedule -> publish -> analytics -> learn
```

HeyGen is the preferred video adapter. Metricool is the preferred scheduler/analytics adapter.

Live publishing and autonomous replies require an explicit policy envelope defining:
- allowed accounts/channels
- allowed content classes
- daily publish/reply ceilings
- response boundaries
- prohibited topics/actions
- escalation rules
- moderation/opt-out handling
- kill switch

## Protected gates

Explicit approval remains required for:
- production deployment or rollback
- DNS/domain changes
- production schema/RLS migrations
- secret creation/replacement
- spend/payment/provisioning with cost
- live customer email/SMS outside an approved envelope
- live social publishing/replies outside an approved envelope
- destructive actions

## Environment variables added by V1

- `CLIENT_ONBOARDING_TOKEN_SECRET`

Existing standalone requirements remain in force:
- Supabase URL/keys
- Vercel AI Gateway credentials
- Vercel/GitHub/Railway provider credentials as required by workers
- Google OAuth/Drive binding for Drive sync
- Gmail binding for delivery email

## Acceptance gates

V1 is not complete until:
1. build/lint/type checks pass,
2. secure token issuance is tested,
3. client intake persists to Supabase,
4. intake completion emits exactly one idempotent website pipeline job,
5. batch queue is load-tested,
6. Drive sync worker is proven,
7. preview provisioning is proven,
8. browser validation passes desktop/mobile,
9. social review job reaches the provider adapter,
10. release rollback is verified.
