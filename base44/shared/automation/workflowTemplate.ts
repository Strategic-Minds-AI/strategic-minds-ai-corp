import { automaticChecksJob } from './autoChecksTemplate.ts';
import { costRenewalStep } from './costRenewalTemplate.ts';
export const codingWorkflow = `name: Benchmark coding cycle
on:
  workflow_dispatch:
    inputs:
      criterion_id:
        description: Benchmark criterion for a bounded review-only change
        default: agents.context
        required: true
        type: string
  schedule:
    - cron: '0 */4 * * *'
permissions:
  contents: read
  actions: read
  pull-requests: read
concurrency:
  group: benchmark-coding-cycle
  cancel-in-progress: false
jobs:
  propose:
    if: vars.BENCHMARK_AUTOMATION_ENABLED == 'true' && vars.BENCHMARK_ZERO_COST_BUDGET_ID != ''
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    permissions:
      contents: read
      actions: read
      pull-requests: read
      id-token: write
    outputs:
      source_sha: \${{ steps.base.outputs.sha }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with:
          ref: main
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: '22.18.0'
${costRenewalStep}      - name: Stop on expired verification, existing review or daily cap
        env:
          GH_TOKEN: \${{ github.token }}
          ZERO_COST_EXPIRES_AT: \${{ steps.cost.outputs.expires_at }}
        run: |
          node --input-type=module <<'JS'
          if (Date.now() >= Date.parse(process.env.ZERO_COST_EXPIRES_AT) || !Number.isFinite(Date.parse(process.env.ZERO_COST_EXPIRES_AT))) throw new Error('Zero-cost verification expired. Refresh it through the admin benchmark panel.');
          const repo = process.env.GITHUB_REPOSITORY;
          const headers = { Authorization: 'Bearer ' + process.env.GH_TOKEN, Accept: 'application/vnd.github+json' };
          const pulls = await fetch('https://api.github.com/repos/' + repo + '/pulls?state=open&per_page=100', { headers });
          if (!pulls.ok) throw new Error('Cannot verify pending reviews.');
          if ((await pulls.json()).some(item => item.head.ref.startsWith('benchmark/candidate-'))) throw new Error('A coding candidate is awaiting review. No second mutation is permitted.');
          for (let page = 1; page <= 20; page++) {
            const response = await fetch('https://api.github.com/repos/' + repo + '/branches?per_page=100&page=' + page, { headers });
            if (!response.ok) throw new Error('Cannot verify isolated candidate branches.');
            const branches = await response.json();
            if (branches.some(item => item.name.startsWith('benchmark/candidate-'))) throw new Error('Review or delete the outstanding candidate branch before another change.');
            if (branches.length < 100) break;
            if (page === 20) throw new Error('Branch scan exceeded its safety bound.');
          }
          // Private draft artifacts no longer block the next bounded cycle: each draft is checked automatically in a separate job.
          const day = new Date().toISOString().slice(0, 10);
          const runs = await fetch('https://api.github.com/repos/' + repo + '/actions/workflows/benchmark-coding.yml/runs?created=' + encodeURIComponent(day + '..' + day) + '&per_page=100', { headers });
          if (!runs.ok || (await runs.json()).total_count > 6) throw new Error('Daily six-cycle ceiling reached or history unavailable. Pause and refresh tomorrow.');
          JS
      - id: base
        run: echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"
      - name: Install pinned local CPU inference; no paid model service
        run: |
          curl --fail --location --retry 2 https://github.com/ollama/ollama/releases/download/v0.35.0/ollama-linux-amd64.tar.zst -o /tmp/ollama.tar.zst
          echo '1c114a6b220c5efca2ef2b1e5f01d1e535e26f6cd6d1678c8489325d2835e525  /tmp/ollama.tar.zst' | sha256sum --check --strict
          mkdir -p /tmp/ollama
          tar --zstd -xf /tmp/ollama.tar.zst -C /tmp/ollama
          CUDA_VISIBLE_DEVICES='' OLLAMA_HOST=127.0.0.1:11434 OLLAMA_NUM_PARALLEL=1 /tmp/ollama/bin/ollama serve > /tmp/ollama.log 2>&1 &
          for attempt in $(seq 1 60); do curl --fail --silent http://127.0.0.1:11434/api/version && break; sleep 1; done
          OLLAMA_HOST=127.0.0.1:11434 /tmp/ollama/bin/ollama pull qwen2.5-coder:1.5b
      - name: Propose one bounded source change
        env:
          CRITERION_ID: \${{ inputs.criterion_id || vars.BENCHMARK_NEXT_CRITERION || 'agents.context' }}
        run: node automation/worker.mjs --run
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: coding-candidate
          path: |
            automation-proposal.json
            src/components
            src/pages
            base44/shared
            base44/functions
          retention-days: 1
          if-no-files-found: error
` + automaticChecksJob;
export const validatorWorkflow = `name: Independent benchmark CI
on:
  push:
    branches: ['benchmark/install-coding-system-v1', 'benchmark/install-automated-checks-v2', 'benchmark/install-cost-renewal-v3', 'benchmark/install-rollback-rehearsal-v4']
  workflow_dispatch:
    inputs:
      candidate_sha:
        description: Exact candidate commit to validate
        type: string
        required: true
      baseline_sha:
        description: Trusted ancestor containing the validator
        type: string
        required: true
permissions:
  contents: read
concurrency:
  group: benchmark-ci-\${{ inputs.candidate_sha || github.sha }}
  cancel-in-progress: false
jobs:
  validate:
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    env:
      CANDIDATE_SHA: \${{ inputs.candidate_sha || github.sha }}
      BASELINE_SHA: \${{ inputs.baseline_sha || github.sha }}
      CANDIDATE_DIRECTORY: candidate
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with:
          ref: \${{ env.BASELINE_SHA }}
          path: trusted
          persist-credentials: false
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with:
          ref: \${{ env.CANDIDATE_SHA }}
          path: candidate
          persist-credentials: false
          fetch-depth: 0
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: '22.18.0'
      - name: Verify immutable revisions and trusted ancestor
        id: identity
        env:
          EVENT_NAME: \${{ github.event_name }}
        run: |
          node trusted/automation/review-policy.mjs --verify-diff
          if [ "$EVENT_NAME" = "workflow_dispatch" ]; then
            test "$GITHUB_REF" = 'refs/heads/main'
            git -C candidate merge-base --is-ancestor "$BASELINE_SHA" origin/main
          fi
      - name: Install trusted frozen dependencies without lifecycle scripts
        id: dependencies
        working-directory: trusted
        run: npm ci --ignore-scripts --no-audit --no-fund
      - name: Prepare pinned isolated runtime
        id: isolation
        run: |
          docker pull node:22.18.0-bookworm-slim@sha256:752ea8a2f758c34002a0461bd9f1cee4f9a3c36d48494586f60ffce1fc708e0e
          node trusted/automation/sandbox.mjs --isolation-check
      - name: Execute host-owned assertions against isolated candidate probes
        id: assertions
        run: |
          node trusted/automation/materialize-draft.mjs --self-check
          node --experimental-strip-types --loader ./trusted/automation/runtime-loader.mjs trusted/automation/validator.mjs
      - name: Compile candidate frontend without network or host write access
        id: compile
        run: node trusted/automation/sandbox.mjs --compile
      - name: Rehearse exact source rollback and compile restored baseline in isolation
        id: rollback
        run: node trusted/automation/rollback.mjs
      - name: Finalize honest CI report including compilation failures
        if: always()
        env:
          ISOLATION_RESULT: \${{ steps.isolation.outcome }}
          IDENTITY_RESULT: \${{ steps.identity.outcome }}
          ASSERTIONS_RESULT: \${{ steps.assertions.outcome }}
          DEPENDENCIES_RESULT: \${{ steps.dependencies.outcome }}
          COMPILE_RESULT: \${{ steps.compile.outcome }}
          ROLLBACK_RESULT: \${{ steps.rollback.outcome }}
        run: node trusted/automation/finalize.mjs
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: benchmark-offline-ci-\${{ github.run_id }}
          path: |
            benchmark-ci-report.json
            benchmark-rollback-report.json
          retention-days: 1
          if-no-files-found: error
`;