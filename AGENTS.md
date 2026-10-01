# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.


## Mandatory Autonomous Coding Validation

This repository uses fail-closed line-level validation for autonomous coding agents.

- An autonomous writer may propose source text in memory, but it MUST NOT materialize a source line until a separate trusted validator process returns PASS for that exact path, line number, line text, and previous-chain hash.
- Line N+1 MUST NOT be materialized until the validation receipt for line N is PASS.
- The implementer/writer cannot self-certify a line.
- Each PASS receipt MUST bind the line SHA-256 to a rolling SHA-256 chain.
- Any FAIL, HOLD, malformed receipt, validator crash, timeout, or sensitive-line review requirement MUST abort the remaining materialization for that cycle.
- Independent CI MUST replay every line receipt against the final candidate bytes before compilation or publication.
- Per-line PASS is necessary but not sufficient: full-file static checks, tests, isolated compilation, rollback rehearsal, and release validation still apply.
- No later build, test, merge, deploy, or release step may override a failed/missing line receipt.
- Protected paths, credentials, auth/security controls, automation policy, workflows, secrets, production data, DNS, billing, permissions, destructive actions, and production release remain outside autonomous writer scope unless separately approved.
- This rule applies to all autonomous coding agents operating on Strategic Minds AI code, regardless of model or provider.
