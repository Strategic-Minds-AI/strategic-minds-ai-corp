# Digital Dominance V4 Sync Gateway | Phase-1 integration
Independent Node.js bridge for the two observed legacy Base44 pack contracts. **This is a preview integration adapter, not yet a production service or durable queue.**
## Run
`npm test`
`DD_SYNC_GATEWAY_TOKEN=... DD_BASE44_SYNC_TOKEN=... DD_BASE44_SYNC_URL=https://... DD_BASE44_ADAPTER=ingestPack node src/server.mjs`
POST /api/v1/packs with Authorization: Bearer <gateway-token> and JSON containing name, kind, preview_html, brand_tokens.
For the other actual implementation use adapter `packSync` and its existing authorized URL. Secrets must be configured server-side, never in chat/browser.
**Known limits:** >30k UTF-8 byte packs produce 422 requiring future independent artifact storage, not truncated submissions. The upstream acceptance result is NOT a verified read-back or approval. Current implementation has no durable queue, tenant authentication, replay/idempotency persistence, independent sanitizer or rate limiter. Do not expose this server publicly until those are implemented.
Check and validate the upstream domain before setting DD_BASE44_SYNC_URL; HTTPS-only with static trusted host configuration. Avoid arbitrary user-supplied URLs.
The code is isolated from production and has no changes to existing app.
