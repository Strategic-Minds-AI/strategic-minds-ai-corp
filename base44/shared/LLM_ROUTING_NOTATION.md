# LLM Routing Notation — Owner's Vercel AI Gateway

Every AI request in the independent deployment uses `AI_GATEWAY_API_KEY` on the server. No browser-prefixed gateway key, platform SDK, hosted agent service, model-credit fallback, connector-token fallback or storage fallback is used.

`src/server/gateway.mjs` is the standalone transport. It accepts prompts, message history, JSON schemas and native tool definitions; it validates structured responses and rejects empty or truncated output. Existing shared gateway imports are composed to this transport by the standalone build. `AI_GATEWAY_MODEL` controls the default model; the server accepts provider-qualified overrides.

- Text, agent/tool loops and structured extraction: `https://ai-gateway.vercel.sh/v1/chat/completions`.
- Image generation: Gateway image modalities; image bytes are saved to owned Supabase storage rather than record fields.
- Speech/transcription/video: the Gateway native model protocol, with server-only authorization.
- Search: a Gateway search-capable model configured by `AI_GATEWAY_SEARCH_MODEL`; unsupported capabilities must fail rather than claim a grounded result.
- End-user uploads and generated source artifacts: private Supabase storage, owner-scoped signed URLs.
- Published branding assets and sitemaps: public Supabase assets, as required for unauthenticated rendering/crawling.

All legacy `Core.InvokeLLM` names are compatibility methods on the owned client, not platform integrations. Nested function calls execute owned handlers in-process with the existing authenticated identity. Agent tool permissions are taken from existing configuration and enforced by the function/data layer.

`npm run build:standalone` produces a clean deployment package and a dependency inventory. The independent package omits mandatory editor-only tooling. Building it does not migrate records, transfer hosting secrets, reconnect OAuth accounts or update external provider callbacks; those remain explicit cutover requirements.