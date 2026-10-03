# Strategic Minds AI — Local Command Pipeline

This directory establishes the full Docker-based local command pipeline that converges
your owned infrastructure: **Docker → Railway → Supabase → Git → Vercel → Google Cloud → Workspace**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Portal (Vercel)                                          │
│  ├── Operator Dashboard  ←→  Supabase (entities, auth)         │
│  ├── AI Agent (Vercel AI Gateway)                               │
│  └── Vault (encrypted credentials)                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────────┐
│  Desktop Companion (Docker / native)                            │
│  ├── Polls deviceBridge function every 5s                      │
│  ├── Executes: browser_*, open_url, screen_info                 │
│  ├── Native mode: click, type_text, press_key, scroll, phone_* │
│  └── Local MCP server for AI clients (Claude Desktop, Cursor)   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│  Cloud Browser Engine (Railway / Google Cloud Run)              │
│  └── Playwright headless Chromium for browser automation        │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Pair a device

In the admin portal → **Operator** → **Systems** → **Pair Device**.
Save the `device_id` and `token` from the response.

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env:
#   OPERATOR_ENDPOINT=https://strategic-ai-consulting.base44.app/api/runtime/functions/deviceBridge
#   OPERATOR_TOKEN=<64-char hex from pairing>
#   OPERATOR_DEVICE_ID=<device UUID from pairing>
#   OPERATOR_BROWSER_URL=http://browser-engine:3100  (optional)
#   OPERATOR_BROWSER_KEY=strategic-browser-key        (optional)
```

### 3. Run the pipeline

```bash
docker compose up -d
```

This starts:
- **companion** — polls your backend for queued commands
- **browser-engine** — Playwright headless Chromium for browser actions

### 4. Verify

```bash
docker compose logs -f companion
# Should show: "Operator companion (Docker) connected. Device: <id>…"
```

## Deployment Targets

### Railway (backend + companion)
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy the companion as a Railway service
railway link  # link to your project
railway up    # deploy from docker/companion/
```

Set environment variables in Railway dashboard:
- `OPERATOR_ENDPOINT`, `OPERATOR_TOKEN`, `OPERATOR_DEVICE_ID`
- `OPERATOR_BROWSER_URL`, `OPERATOR_BROWSER_KEY`

### Google Cloud Run (browser engine)
```bash
# Build and deploy the browser engine to Cloud Run
gcloud run deploy strategic-browser \
  --image mcr.microsoft.com/playwright:v1.48.0-jammy \
  --region us-central1 \
  --port 3100 \
  --set-env-vars BROWSER_API_KEY=your-key \
  --allow-unauthenticated
```

Set `OPERATOR_BROWSER_URL` to the Cloud Run URL.

### Vercel (frontend + API)
The frontend and API are already deployed on Vercel. The operator page is at
`/operator` in the admin portal. The backend functions are at:
- `/api/runtime/functions/computerControl`
- `/api/runtime/functions/deviceBridge`
- `/api/runtime/functions/operatorDevices`
- `/api/runtime/functions/auditOperator`
- `/api/runtime/functions/enqueueOperatorSchedules`

### Supabase (database + auth)
Entities are stored in Supabase. Run the schema migration:
```bash
# The standalone build applies the schema automatically on deploy.
# For manual migration, see src/deployment/runtimeSchema.sql
```

### Git (source control)
The full source is synced to GitHub. Push changes to deploy:
```bash
git add -A && git commit -m "Add local command pipeline" && git push
```

## Native Desktop Mode (full GUI control)

For full desktop control (click, type, screenshot), run the companion natively
on your desktop — Docker containers cannot access the host display.

### Windows
```cmd
cd docker\companion
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python operator_companion.py --worker --allow-input
```

### macOS / Linux
```bash
cd docker/companion
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python operator_companion.py --worker --allow-input
```

### Local MCP (for AI clients)
```bash
python operator_companion.py --print-mcp-config --allow-input > mcp-config.json
# Import mcp-config.json into Claude Desktop, Cursor, etc.
```

## Agent Integration

The admin assistant can now:
- **Read/write** all entities (OperatorTask, OperatorSchedule, ComputerCommand, etc.)
- **Execute** backend functions (computerControl, operatorDevices, auditOperator)
- **Control the vault** when explicitly commanded (read/write encrypted credentials)
- **Command all agents** via dispatchAgentTask
- **Provision projects** via provisionSystem, provisionSite
- **Operate persistently** via the Recursive Evolution Loop (10-min cron)

## Security

- All operator endpoints require admin authentication
- Device pairing tokens are SHA-256 hashed, never stored in plaintext
- Commands expire after 120 seconds if not claimed
- The companion uses a fail-safe (mouse-to-corner) for emergency stops
- No shell execution tool is provided — only bounded desktop/browser actions
- Vault access requires explicit user command
- All actions are logged in OperatorAudit records