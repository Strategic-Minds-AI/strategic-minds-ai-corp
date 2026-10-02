# LLM Routing Notation — Vercel AI Gateway

**Mandate:** Every LLM call in this app routes through the Vercel AI Gateway
(`base44/shared/aiGateway.ts`) using the `AI_GATEWAY_API_KEY` secret. The
built-in `base44.integrations.Core.InvokeLLM` integration is **never** used —
it is blocked by workspace integration-credit exhaustion and bypassed entirely.

## Gateway client

`base44/shared/aiGateway.ts` exports `callAIGateway(options)`:
- POSTs to `https://ai-gateway.vercel.sh/v1/chat/completions`
- Auth: `Bearer ${process.env.AI_GATEWAY_API_KEY}`
- Default model: `anthropic/claude-sonnet-4-5`
- Supports `system`, `prompt`, `messages`, `temperature`, `maxTokens`, `jsonSchema`
- Returns `{ content, json, model, usage }`

## Functions that route through the gateway

| Function | LLM use | Status |
|---|---|---|
| `adminAssistant` | Admin chat assistant | Direct gateway call (OpenAI-compatible) |
| `domainOperations` | Competitor analysis + strategic insight | `callAIGateway` |
| `crmAssist` | Follow-up email draft | `callAIGateway` |
| `adminChatActions.js` (frontend) | Web/attachments/default chat | Routes through `adminAssistant` |

## What the gateway does NOT support

- `add_context_from_internet` (live web search) — not available; answer from training knowledge.
- `file_urls` (vision/file analysis) — not available; attachment names are passed as text context only.
- `GenerateImage` — separate integration, still uses the built-in (credit-blocked when credits are exhausted).

## Adding a new LLM call

1. `import { callAIGateway } from '../../shared/aiGateway.ts';`
2. Call `await callAIGateway({ prompt, jsonSchema?, system?, messages? })`
3. Read `.content` (string) or `.json` (parsed object when `jsonSchema` is set).
4. Never import or call `base44.integrations.Core.InvokeLLM`.