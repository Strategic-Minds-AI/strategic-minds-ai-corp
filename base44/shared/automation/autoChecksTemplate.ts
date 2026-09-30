export const automaticChecksJob = `  validate_draft:
    name: Independent automatic draft checks
    needs: propose
    if: needs.propose.result == 'success'
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: read
      actions: read
    env:
      BASELINE_SHA: \${{ needs.propose.outputs.source_sha }}
      CANDIDATE_DIRECTORY: candidate
      AUTOMATED_DRAFT: 'true'
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with:
          ref: \${{ env.BASELINE_SHA }}
          path: trusted
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: '22.18.0'
      - name: Download this run's draft without executing it
        id: artifact
        uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093
        with:
          name: coding-candidate
          path: draft
      - name: Exercise negative controls and materialize an unpublished local candidate
        id: materialize
        run: |
          node trusted/automation/materialize-draft.mjs --self-check
          node trusted/automation/materialize-draft.mjs --materialize
      - name: Verify exact baseline, candidate and permitted diff
        id: identity
        run: node trusted/automation/review-policy.mjs --verify-diff
      - name: Install trusted frozen dependencies without lifecycle scripts
        id: dependencies
        working-directory: trusted
        run: npm ci --ignore-scripts --no-audit --no-fund
      - name: Verify pinned isolated runtime
        id: isolation
        run: |
          docker pull node:22.18.0-bookworm-slim@sha256:752ea8a2f758c34002a0461bd9f1cee4f9a3c36d48494586f60ffce1fc708e0e
          node trusted/automation/sandbox.mjs --isolation-check
      - name: Run host-owned assertions against isolated draft
        id: assertions
        run: node --experimental-strip-types --loader ./trusted/automation/runtime-loader.mjs trusted/automation/validator.mjs
      - name: Compile isolated candidate without network or host write access
        id: compile
        run: node trusted/automation/sandbox.mjs --compile
      - name: Record actual checks; never authorize a production release
        if: always()
        env:
          ARTIFACT_RESULT: \${{ steps.artifact.outcome }}
          MATERIALIZE_RESULT: \${{ steps.materialize.outcome }}
          ISOLATION_RESULT: \${{ steps.isolation.outcome }}
          IDENTITY_RESULT: \${{ steps.identity.outcome }}
          ASSERTIONS_RESULT: \${{ steps.assertions.outcome }}
          DEPENDENCIES_RESULT: \${{ steps.dependencies.outcome }}
          COMPILE_RESULT: \${{ steps.compile.outcome }}
        run: node trusted/automation/finalize.mjs
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: automatic-draft-checks-\${{ github.run_id }}
          path: benchmark-ci-report.json
          retention-days: 1
          if-no-files-found: error
`;