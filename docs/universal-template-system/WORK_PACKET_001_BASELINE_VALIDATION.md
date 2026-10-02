# WORK PACKET 001 — CURRENT BASELINE VALIDATION

Packet status: READY_FOR_BRANCH_EXECUTION
Target: current convergence branch only
Production mutation: prohibited

## Objective

Establish a trustworthy current baseline before importing or modifying any additional Universal Master Factory definitions.

## Starting source

Branch starts from commit:
`3d46802e85ede0756dea99db5085f1cc6ef3faae`

Do not reuse stale error counts from older receipts as current facts.

## Allowed scope

- read repository
- install normal development dependencies
- run lint/typecheck/build/tests
- add or repair branch-only tests
- repair the smallest responsible shared type/component contract
- add CI configuration on this branch
- create validation receipts
- update convergence documentation

## Forbidden scope

- direct changes to main
- production deploy/redeploy
- production database/RLS changes
- secret/env mutation
- DNS/domain changes
- customer/public messaging
- destructive cleanup
- paid provisioning

## Required checks

1. Dependency install reproducibility
2. `npm run lint`
3. `npm run typecheck` or equivalent configured TypeScript check
4. `npm run build`
5. Existing unit/contract tests
6. Existing integration tests
7. Existing E2E/smoke tests
8. Verify whether substantive automated coverage is absent
9. Verify Universal Factory source paths compile against current app contracts
10. Verify frontend factory imports and registry loading
11. Verify no protected operation can report fake success when unconfigured

## Failure handling

For each failure:
1. capture exact command and error
2. classify root cause
3. identify smallest responsible layer
4. patch only that layer
5. rerun failing check
6. run adjacent regression checks
7. record PASS / FAIL / BLOCKED receipt

## Exit criteria

This packet is complete only when the branch has:
- reproducible baseline evidence
- current error counts
- a deterministic repair queue
- CI/test gaps explicitly recorded
- no production mutation
- independent validation requirements documented

Passing build alone is insufficient.
