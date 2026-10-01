# Strategic Minds Founder Action Runtime

## Purpose

Turn Digital Dominance / NearMe / NearYou intelligence into deterministic system work instead of a passive founder report.

This runtime is a managed child of the canonical ZERO heartbeat. It MUST NOT create another cron.

```
ZERO heartbeat
  -> StrategicMindsAI founder action runtime
  -> collect/refresh evidence
  -> classify findings
  -> create eligible action packets
  -> execute safe work only
  -> independent validation
  -> receipt
  -> approval candidate or next action
```

## Runtime contract

Input from ZERO:

- `run_id`
- `max_domains`
- `mode=ZERO_HEARTBEAT`
- `source_sha`

Output:

- `processed_count`
- `pass`
- `fail`
- `blocked`
- `unknown`
- `results[]`

Every PASS result MUST contain an independent `receipt_id`.

## Existing backend primitives to reuse

- `Domain`: canonical monitored domain registry.
- `DomainMetric`: GSC, GA4, sitemap, competitor and insight snapshots.
- `domainOperations`: existing domain analysis engine.
- `Lead`, `CrmContact`, `CommerceOrder`: funnel / CRM / verified payment evidence.
- `EnhancementJob`: bounded implementation-plan work.
- `BenchmarkRun` / `BenchmarkCheckpoint`: validation evidence.
- existing independent line-gated coding automation.

Do not create duplicate systems when these primitives are sufficient.

## Action classification

### AUTO_EXECUTE

Safe, reversible internal actions:

- refresh read-only domain evidence
- compare latest DomainMetric with prior snapshot
- detect stale or missing evidence
- deduplicate keyword / canonical intent candidates
- create a draft analysis or implementation brief
- create a validation task
- create a repair candidate in branch/preview scope
- update internal `next_action` and evidence pointers
- record receipts

### APPROVAL_REQUIRED

Never execute from the heartbeat:

- production deploy or merge
- DNS or registrar change
- domain purchase / renewal
- Search Console ownership/property mutation
- sitemap submission when treated as an external write
- production database/schema/RLS mutation
- secret or permission change
- paid provider call / spend
- public publishing / ads
- customer or employee outbound messages
- destructive or irreversible operation

The runtime creates an approval candidate with the exact proposed action, evidence, rollback and cost. It does not execute it.

### WATCH

Use when evidence is incomplete, stale, contradictory or statistically weak. WATCH items continue gathering evidence without producing a protected action.

## Deterministic rules

1. Missing evidence is UNKNOWN, never zero.
2. Internal estimates never become Google facts.
3. GA4 revenue is not verified revenue unless joined to CRM/order truth.
4. One canonical intent owns a page before any new URL is proposed.
5. Location/service pages remain NOINDEX until PageSpec/index-eligibility PASS.
6. Implementers cannot validate their own release-critical work.
7. Every cycle is idempotent by `run_id + domain_id + evidence_hash`.
8. No alert is created for routine success.
9. Material FAIL or protected approval requirement creates one idempotent operator-alert candidate.
10. No child runtime owns a scheduler.

## Initial registered Digital Dominance domains

- `epoxyquotenearme.com`
- `leadgenerationnearyou.com`
- `leadgennearyou.com`

The corporate backend registry is the action-control surface. Source analytics remain evidence-scoped and must retain provider identity and retrieval timestamp.

## Founder action outputs

Each cycle should produce, when evidence supports it:

- anomalies requiring repair
- positive / negative deltas
- keyword/content opportunities
- indexing/sitemap issues
- conversion gaps
- lead/sales attribution gaps
- data-quality repairs
- PageSpec promotion candidates
- approval-required protected actions
- branch-safe implementation candidates
- exact next best eligible action

## Release gate

Production binding stays disabled until:

1. the runtime adapter is implemented through the independent line gate;
2. exact response-contract tests PASS;
3. ZERO independently validates child receipts;
4. preview deployment identity is verified;
5. rollback is proven;
6. the operator explicitly approves production environment binding.
