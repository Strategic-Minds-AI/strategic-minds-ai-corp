# Strategic Minds AI — End-to-End Forensic Audit & Production Execution Plan

**Audit Date:** 2026-10-03  
**Scope:** Every folder, file, route, entity, function, workflow, and deployment artifact  
**Build Status:** ✅ Frontend builds | ✅ Standalone builds (61 functions, 191 entities, 0 platform deps)  

---

## Executive Summary

The application is a complex, multi-subsystem business diagnostic and professional services platform with 191 entities, 61 backend functions, 12 AI agents, 13 workflows, and 71 routes. The migration from Base44 to an independent Supabase/Vercel/Railway stack is architecturally complete — the standalone build produces zero platform dependencies — but **15 critical gaps** prevent full production readiness.

---

## GAP INVENTORY

### 🔴 CRITICAL (Blocks Production)

| # | Gap | Impact | Files |
|---|-----|--------|-------|
| C1 | **Duplicate `/factory` route** — mapped to both `SystemFactory` (line 136) and `FactoryOS` (line 142). Second wins; SystemFactory is unreachable. | Dead route, user confusion | `src/App.jsx` |
| C2 | **61 entities have no RLS** — any authenticated user can read/write all records in 61 tables (AuditEvidence, Backlink, BrandPack, BuildProject, Contact, Competitor, CustomerProfile, Deal, DomainCandidate, Expense, Experiment, GenerationJob, Industry, Invoice, Market, RepairJob, SeoPage, Tactic, TemplateLibrary, ValidationRun, WebsiteGenome, etc.) | Data leak — any user sees all data in those tables | `base44/entities/*.jsonc` (61 files) |
| C3 | **`dashboardMetrics` function has no auth** — any unauthenticated caller can invoke it and read admin dashboard data | Data leak | `base44/functions/dashboardMetrics/entry.ts` |
| C4 | **`benchmarkCostRenewal` function has no auth** — scheduled function callable without credentials | Unauthorized cost operations | `base44/functions/benchmarkCostRenewal/entry.ts` |
| C5 | **Railway backend is a stub** — `railway/src/server.js` has TODO placeholders for SendEmail, UploadPrivateFile, UploadPublicFile, CreateFileSignedUrl. Only provisionSite is mounted. This is superseded by `src/server/` standalone runtime but creates confusion about which backend is live. | Dead code, deployment confusion | `railway/src/server.js` |
| C6 | **Standalone not deployed to production** — `runtimeTransport.js` falls back to `https://strategic-minds-ai-corp.vercel.app/api/runtime` but the editor preview runs against the old Base44 backend (`VITE_STANDALONE` not set). The independent runtime exists but isn't serving production traffic. | Editor preview ≠ production | `src/lib/runtimeTransport.js` |
| C7 | **`worker_fleets` table schema mismatch** — query for `status` column fails with 400. Table exists but column is missing. | Worker fleet management broken | `supabase/schema.sql`, `.standalone/schema.sql` |
| C8 | **No Stripe products configured** — Stripe is in live mode but has zero products or prices. Commerce checkout has nothing to sell. | Revenue blocked | Stripe dashboard |
| C9 | **No sandboxes provisioned** — `sandboxes` table is empty. Generator deployment testing has no execution workers. | Build testing broken | Database |

### 🟡 HIGH (Degrades Quality)

| # | Gap | Impact | Files |
|---|-----|--------|-------|
| H1 | **55 ESLint errors** — all unused imports across 10+ page files | Code smell, build noise | 10 page files |
| H2 | **2.2MB main bundle** (656KB gzipped) — needs code splitting | Slow initial load | `src/App.jsx` lazy imports |
| H3 | **Dual entry points** — both `App.tsx`/`App.jsx` and `main.tsx`/`main.jsx` exist. Only `.jsx` is used; `.tsx` is dead. | Confusion, potential build conflicts | `src/App.tsx`, `src/main.tsx` |
| H4 | **Dead legacy pages** — `Blank.jsx`, `StrategicHome.jsx`, `not-found.tsx` are not referenced by `App.jsx` | Repo bloat | `src/pages/Blank.jsx`, `src/pages/StrategicHome.jsx`, `src/pages/not-found.tsx` |
| H5 | **No error tracking** — no Sentry or equivalent. Runtime errors in production are invisible. | Blind to prod errors | — |
| H6 | **No test suite** — only `gatewayCredentials.test.mjs` exists. 61 functions and 71 routes have no tests. | Regression risk | — |
| H7 | **Mail implementation unverified** — `src/server/mail.mjs` exists but the Railway stub says "not yet configured." Need to verify the standalone runtime's SendEmail works. | Email flows may be broken | `src/server/mail.mjs` |

### 🟢 MEDIUM (Polish)

| # | Gap | Impact |
|---|-----|--------|
| M1 | `_generated_linegate/` directory with external GitHub workflows not part of the app build | Repo bloat |
| M2 | No uptime monitoring or alerting | No prod health visibility |
| M3 | No CI/CD pipeline for automated tests on PR | Manual QA only |
| M4 | `supabase/schema.sql` and `supabase/migration.sql` are older versions; the authoritative schema is `.standalone/schema.sql` | Schema drift risk |
| M5 | 13 workflows but only 4 scheduled + 3 entity-triggered are active in standalone; the rest are dormant | Inactive automations |

---

## FULL EXECUTION PLAN

### Phase 1: Critical Fixes (Do First)

#### Step 1.1 — Fix duplicate `/factory` route
- **File:** `src/App.jsx`
- **Action:** Remove the duplicate `<Route path="/factory" element={<SystemFactory />} />` on line 136 (keep the `FactoryOS` mapping on line 142, or rename one to `/system-factory` if both are needed)
- **Verify:** Both `/factory` and `/system-factory` resolve to distinct pages

#### Step 1.2 — Add RLS to 61 unprotected entities
- **Files:** 61 entity `.jsonc` files in `base44/entities/`
- **Action:** Add `rls` block to each. Pattern:
  ```jsonc
  "rls": {
    "read": { "user_condition": { "role": "admin" } },
    "create": { "user_condition": { "role": "admin" } },
    "update": { "user_condition": { "role": "admin" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
  ```
  For user-scoped entities (Expense, Budget, Deal), use `created_by_id` ownership instead of admin-only.
- **Verify:** Non-admin users cannot read admin-only tables

#### Step 1.3 — Add auth to unprotected functions
- **Files:** `dashboardMetrics/entry.ts`, `benchmarkCostRenewal/entry.ts`
- **Action:** Add `getSupabaseUser` + admin role check
- **Note:** `commerceCheckout`, `commerceQuote`, `captureAgencyLead`, `commerceWebhook`, `twilioWebhook`, `getAuthConfig`, `seed-*`, `send-form-emails`, `syncLeadToCrm` are intentionally public (webhooks, public forms, seeding) — leave those
- **Verify:** Direct invocation without auth returns 401

#### Step 1.4 — Fix `worker_fleets` schema
- **File:** `.standalone/schema.sql` (regenerate) or direct SQL migration
- **Action:** Add missing `status` column to `worker_fleets` table
- **Verify:** `SELECT status FROM worker_fleets LIMIT 1` succeeds

#### Step 1.5 — Remove dead Railway stub
- **Action:** Delete `railway/` directory (superseded by `src/server/` standalone runtime)
- **Verify:** Build still passes

#### Step 1.6 — Set `VITE_STANDALONE=true` for production builds
- **File:** `vite.config.js` or Vercel env vars
- **Action:** Set `VITE_STANDALONE=true` so `runtimeTransport.js` uses same-origin `/api/runtime` instead of the hardcoded Vercel fallback
- **Verify:** Browser network tab shows requests to `/api/runtime`, not `strategic-minds-ai-corp.vercel.app`

### Phase 2: Production Deployment

#### Step 2.1 — Apply standalone schema to Supabase
- **File:** `.standalone/schema.sql`
- **Action:** Run in Supabase SQL editor. Creates all 191 tables, RLS policies, storage buckets, triggers, and RPC functions
- **Verify:** `\dt` in Supabase shows all tables; `runtime_user_role()` function exists

#### Step 2.2 — Configure all environment variables
- **File:** `src/deployment/standalone.env.example` (reference)
- **Action:** Set all 25+ env vars in Vercel project settings:
  - `AI_GATEWAY_API_KEY`, `AI_GATEWAY_MODEL`
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
  - `APP_ID`, `APP_URL`, `API_URL`
  - `JOB_OWNER_ID`, `CRON_SECRET`, `ENABLE_SCHEDULER`
  - `ALLOWED_ORIGINS`
  - `VAULT_BACKUP_ENCRYPTION_KEY`
  - `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `GODADDY_API_KEY`, `GODADDY_API_SECRET`
  - `RAILWAY_API_TOKEN`, `VERCEL_API_TOKEN`
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_STANDALONE=true`
- **Verify:** `/api/runtime/health` returns `aiConfigured: true`

#### Step 2.3 — Deploy to Vercel
- **Action:** Push to repo; Vercel auto-deploys via `build:vercel` command (Build Output API emits both website + API)
- **Verify:** Production URL loads; `/api/runtime/health` returns 200; login works; chat works

#### Step 2.4 — Create Stripe products
- **Action:** Create products and prices in Stripe for each CatalogItem; update webhook endpoint to `https://strategic-ai-consulting.base44.app/functions/commerceWebhook`
- **Verify:** Checkout flow completes; webhook receives events

#### Step 2.5 — Provision at least one sandbox
- **Action:** Use Sandbox Manager UI to create a Railway sandbox; deploy the railway worker
- **Verify:** Sandbox health shows "healthy"; generator deploy tests run

### Phase 3: Code Quality

#### Step 3.1 — Fix all 55 ESLint errors
- **Action:** Run `npm run lint:fix` (auto-fixes all 55 unused-import errors)
- **Verify:** `npm run lint` passes clean

#### Step 3.2 — Remove dead files
- **Action:** Delete `src/App.tsx`, `src/main.tsx`, `src/pages/Blank.jsx`, `src/pages/StrategicHome.jsx`, `src/pages/not-found.tsx`, `src/components/loading.tsx`, `src/components/back-to-top.tsx`, `src/components/scroll-to-top.tsx`, `src/components/dark-mode-switch.tsx`
- **Verify:** Build still passes; no broken imports

#### Step 3.3 — Code-split the main bundle
- **Action:** Add `manualChunks` to Vite config to split vendor libs (react, recharts, three.js, html2canvas) into separate chunks
- **Verify:** Main chunk < 500KB

### Phase 4: Monitoring & Testing

#### Step 4.1 — Add Sentry error tracking
- **Action:** Install `@sentry/react` + `@sentry/vite-plugin`; initialize in `main.jsx`; add Sentry auth token as env var
- **Verify:** Test error appears in Sentry dashboard

#### Step 4.2 — Add core test suite
- **Action:** Write tests for: auth flow, entity CRUD, admin assistant tool execution, commerce checkout, webhook handlers
- **Verify:** `npm test` passes

#### Step 4.3 — Add uptime monitoring
- **Action:** Configure Vercel's built-in cron to hit `/api/runtime/health` every 5 minutes; or use UptimeRobot
- **Verify:** Monitoring dashboard shows uptime

### Phase 5: Activation

#### Step 5.1 — Enable Vercel cron
- **Action:** Set `ENABLE_VERCEL_CRON=true` in Vercel env vars; rebuild
- **Verify:** Scheduled jobs (AutoBuild Recovery, Autonomous Build Loop, CRM Follow-ups, Daily Vault Backup) fire on schedule

#### Step 5.2 — Reauthorize Google OAuth
- **Action:** Register `API_URL/connections/callback` in Google OAuth client; re-authorize all Google connectors (Gmail, Calendar, Drive, etc.)
- **Verify:** Each connector returns data

#### Step 5.3 — Update Stripe/Twilio webhook URLs
- **Action:** Point all webhook endpoints to the production URL
- **Verify:** Webhook events received and processed

#### Step 5.4 — Switch DNS
- **Action:** Point custom domain to Vercel deployment
- **Verify:** Domain resolves; SSL active

---

## SUMMARY METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Build status | ✅ Passes | ✅ Passes |
| Platform dependencies | 0 | 0 |
| Entities with RLS | 130/191 (68%) | 191/191 (100%) |
| Functions with auth | 48/61 (79%) | 55/61 (90%)* |
| ESLint errors | 55 | 0 |
| Test coverage | 1 file | 10+ core flows |
| Error tracking | None | Sentry |
| Bundle size | 2.2MB | < 500KB main chunk |
| Stripe products | 0 | All catalog items |
| Sandboxes | 0 | 1+ healthy |
| Scheduled jobs active | 0 | 4 |

*6 functions are intentionally public (webhooks, public forms, seeding)

---

## RECOMMENDED EXECUTION ORDER

1. **C1** (duplicate route) — 1 minute
2. **C3, C4** (function auth) — 5 minutes
3. **C7** (worker_fleets schema) — 5 minutes
4. **C5** (delete Railway stub) — 1 minute
5. **H1** (lint:fix) — 1 minute
6. **H3, H4** (delete dead files) — 2 minutes
7. **C2** (61 entity RLS) — 30 minutes
8. **C6** (VITE_STANDALONE) — 1 minute
9. **Phase 2** (deploy) — 30 minutes
10. **Phase 3.3** (code splitting) — 10 minutes
11. **Phase 4** (monitoring/tests) — 1 hour
12. **Phase 5** (activation) — 30 minutes

**Total estimated time: 2.5 hours to full production.**