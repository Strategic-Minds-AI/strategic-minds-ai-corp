# Digital Dominance V4.1 | Universal Sync Contract
Mission: DD-V4-UNIVERSAL-SYNC-BUSINESS-OS
State: SPECIFICATION / BRANCH-SAFE. No live provisioning authorized by this document.

## Verified Base44 donor inventory (2026-10-08)
- DominanceFactory `6ac74a836169b94bd04cf453`: Pack with `pending_review/approved/rejected/published`, Website, ProgrammaticRule, SocialPost, SocialAccount.
- Dominance Engine `6ac7bc6cf0b681d8bc7f7aeb`: Opportunity, Website, GeneratedPage.
- Digital Dominance 2.0 `6abe63b2c9b013207fdf4e06`: BrandTemplate, DigitalFootprint; `base44/functions/packSync/entry.ts`.
- Strategic Minds AI Approve Site `6ac59ed63d3511905dea17fb`: client, lead, site/page approval-related schemas.
- Existing Digital Dominance 2 `packSync` accepts Authorization: Bearer PACK_SYNC_TOKEN, action health/list/get/delete/sync; upserts by template_key. It truncates preview_html beyond 30,000 characters.
- Prior operator-provided `legal-lead-logic.base44.app/functions/ingestPack` contract expects `sync_token` in JSON body. Treat as a distinct versioned adapter, not the same API. Do not transmit tokens to clients.

## Architecture
Base44 is a replaceable authoring and approval UI only. Canonical source is GitHub, versioned site artifacts stored in managed object storage, durable state in Supabase, frontend/API in Vercel, persistent isolated workers in Railway where needed, model routing through Vercel AI Gateway. One authoritative scheduler; idempotent queue and writer leases. No production dependency on Base44 after a successful runtime-disconnect canary.

## API /api/v1 (planned endpoints; not yet implemented)
POST /missions; GET /missions/{missionId}; POST /missions/{missionId}/resume
POST /websites/generations; GET /websites/{websiteId}/previews
POST /website-packs; GET /website-packs/{packId}; POST /website-packs/{packId}/review-request
POST /approvals/{approvalId}/decisions (privileged)
POST /provisioning/plans; POST /provisioning/plans/{id}/dry-run
POST /google/search-console/sitemap-plans; GET /receipts/{receiptId}
POST /onboarding/invitations/prepare; POST /enrichment/business/search
GET /clients/{clientId}/crm; GET /clients/{clientId}/analytics

## Universal work packet requirements
mission_id, tenant_id, client_id, action_class, idempotency_key, source_artifact_refs, source_sha, approval_ref, expiration, execution_budget, request_trace_id, expected_output_schema, retry_budget, rollback_ref.
All mutations must be server-authenticated and tenant-authorized. Never expose platform secrets or privileged service-role credentials in frontends or model outputs.

## Pack compatibility envelope
```json
{
  "schema_version": "2.0.0",
  "pack_id": "uuid",
  "tenant_id": "uuid",
  "kind": "web_pack",
  "name": "Sample",
  "source": "gpt_sync",
  "submitted_by_label": "GPT",
  "artifact": {"uri": "object-store-reference", "sha256": "64-hex", "content_type": "text/html"},
  "preview_html": "sanitized small preview, not source of truth",
  "brand_tokens": {},
  "validation": {"state": "pending"},
  "approval": {"state": "pending_review"},
  "created_at": "ISO8601"
}
```
Legacy adapter A: Base44 packSync Bearer header with `action=sync`, `pack.template_key`.
Legacy adapter B: legal-lead-logic ingestPack JSON body sync_token, top-level `name,kind,preview_html,brand_tokens,source,submitted_by_label`.
Both adapters must validate content type, size, authorization, tenant, and replay protection. Preserve the legacy endpoint until contract tests pass. Do not place secrets in model context, source, metadata, screenshots or receipts.

## Client onboarding and business enrichment
Approved email/SMS invite, website form, installable PWA and QR flow -> signed expiring invitation -> ownership verification -> public business fact research -> cited field-level confirmation -> client source-truth packet. Business contact enrichment is separate from regulated personal skip tracing. Apply consent, opt-out, purpose limitation, and provider restrictions. No unauthorized mass outreach or personal-data scraping.

## SEO and release contract
Generate people-first differentiated sites, canonical/robots/404/sitemap, structured data based on verified facts, conversion instrumentation and Search Console property verification. Submit only authorized sitemaps via Search Console API; never imply sitemap equals indexing. Reject doorway pages, mass low-value variations, fabricated reviews/business profiles, manipulative link schemes. Each deploy records source SHA, preview URL, validation metrics, rollout scope and rollback receipt.

## Synthetic canary sequence
1. Create mission and fictional test client (no public false business listings).
2. Generate original website pack; store complete artifact externally.
3. Ingest preview into existing Base44 library through adapter A or B; read back pack and hashes.
4. Request approval; pause at gate.
5. After approval, create branch, run tests and deploy isolated Vercel preview only.
6. Persist events/receipts; independently refetch and validate deploy + responsive screenshots.
7. Generate draft social content, brochure, digital business card and synthetic CRM lead.
8. Prepare, but do not execute, Search Console, GoDaddy DNS, live social and real-client outreach.
9. Reboot/resume simulated worker and verify no duplicate job; test rollback.

## Gates and completion
READ/DRAFT and scoped preview actions automatic. Production, branch merge, DNS, credentials, personal data processing outside approved scopes, spend, social publication, real outreach: explicit scoped approval and independent validation.
PASS only for executed measurable tests. Mark UNKNOWN where unverified.

## Immediate backlog
P0 discover canonical command surface and choose donor app.
P0 inspect live packSync, ingestPack, client approval and source SHA.
P0 create versioned OpenAPI specification and bridge tests.
P1 preview-grade external artifact storage and signing.
P1 Supabase job/lease adapter with single authoritative worker.
P1 one end-to-end synthetic website canary and independent validator.
P2 provider provisioning dry-run adapters.
P2 Search Console, analytics, CRM/PWA, social, distribution approval integrations.
P3 production release candidate and independent Base44-disconnect test.

## Sources reviewed
- https://vercel.com/kb/guide/ai-gateway-and-ai-sdk
- https://vercel.com/kb/workflow-sdk
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/webmaster-tools/v1/sitemaps/submit
