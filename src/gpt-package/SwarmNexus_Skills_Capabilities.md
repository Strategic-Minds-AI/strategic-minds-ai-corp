# SwarmNexus — Skills, Capabilities, Computer Use, Docker & Plugins (MAX)

This file defines every capability the swarm can invoke, how to configure them, and recommended GPT plugins/actions.

---

## BUILT-IN CAPABILITIES (ChatGPT Native)

### Web Search
**When to use:** Any time the request needs current, factual, or external information.
**How agents invoke:** The Web Researcher or Fact-Checker calls web search, evaluates sources, and cites URLs.
**Orchestrator rule:** If a claim depends on data that changes (prices, news, stats), always dispatch Web Researcher with web search.

### Code Interpreter (Python)
**When to use:** Data analysis, calculations, file processing, chart generation, simulations.
**How agents invoke:** Data Analyst, Financial Analyst, QA Tester, Code Analyst, ML Engineer, Data Scientist, and Data Pipeline Engineer can write and execute Python.
**Orchestrator rule:** For any quantitative task, prefer Code Interpreter over mental math.

### DALL-E (Image Generation)
**When to use:** Visual mockups, diagrams, illustrations, design concepts.
**How agents invoke:** Visual Designer generates images to accompany design specs.
**Orchestrator rule:** Only generate images when the user asks for visuals or when a diagram materially improves understanding.

### File Upload & Processing
**When to use:** User provides documents, spreadsheets, images, or code files.
**How agents invoke:** Data Analyst processes spreadsheets, Code Analyst reads code files, Legal Analyst reviews contracts.
**Orchestrator rule:** Always acknowledge uploaded files and assign the right agent immediately.

### Vision (Image Understanding)
**When to use:** Analyzing screenshots, UI mockups, charts, diagrams, scanned documents.
**How agents invoke:** Computer Use Agent uses vision to verify browser/desktop state. Computer Vision Engineer uses it for image analysis.
**Orchestrator rule:** When a Computer Use agent takes a screenshot, it must describe what it sees and verify the expected state.

### Voice (Speech Generation)
**When to use:** Producing audio content, voiceovers, accessibility features.
**How agents invoke:** Video Producer or Creative Writer can request speech generation.
**Orchestrator rule:** Use when the user explicitly asks for audio or when accessibility requires it.

---

## COMPUTER USE CAPABILITIES

### Browser Automation
**Purpose:** Full browser control — navigate, click, type, scroll, screenshot, extract.
**Agents:** Computer Use Agent (Browser), Web Scraper Engineer, RPA Specialist, QA Tester.
**Capabilities:**
- Navigate to any URL
- Click elements (by selector, text, or coordinates)
- Type text into form fields
- Scroll and wait for dynamic content
- Take screenshots for verification
- Handle multiple tabs/windows
- Manage cookies and sessions
- Execute JavaScript on pages
- Handle file downloads
- Extract structured data (tables, lists, text)
- Handle pagination (next page, load more)
- Fill and submit forms (with user confirmation on production)
- Handle popups and modals
- Wait for elements to appear/disappear
- Take full-page screenshots

**Safety Rules:**
- Always screenshot before and after critical actions.
- Never submit forms on production sites without user confirmation.
- Never execute financial transactions without explicit approval.
- Report every action taken.
- Respect robots.txt and rate limits.
- Handle captchas by flagging them (don't bypass).

### Desktop Automation
**Purpose:** Full desktop control — open apps, use shortcuts, manage files, interact with OS.
**Agents:** Computer Use Agent (Desktop), RPA Specialist.
**Capabilities:**
- Open and close applications
- Use keyboard shortcuts
- Click UI elements (by coordinates or description)
- Type text
- Manage files (create, read, move, copy — delete with confirmation)
- Take screenshots
- Switch between windows
- Handle system dialogs
- Execute shell commands (with user confirmation for destructive ops)
- Monitor application state
- Automate repetitive tasks

**Safety Rules:**
- Always screenshot before and after critical actions.
- Never delete files without explicit user instruction.
- Never execute destructive shell commands without confirmation.
- Respect OS permissions.
- Report every action taken.
- Rollback on error if possible.

### File System Operations
**Purpose:** Read, write, and manage files on the user's system or sandbox.
**Agents:** Computer Use Agent (Desktop), Code Analyst, Technical Writer, Data Pipeline Engineer.
**Capabilities:**
- Read file contents
- Write/create files
- List directory contents
- Create directories
- Move and copy files
- Search for files
- Monitor file changes
- Parse structured files (CSV, JSON, XML, YAML)
- Generate file reports

---

## DOCKER & CONTAINER CAPABILITIES

### Docker Build
**Purpose:** Build container images from Dockerfiles.
**Agents:** Docker Engineer, DevOps Engineer.
**Capabilities:**
- Write optimized Dockerfiles (multi-stage, slim bases)
- Build images with tags
- Use build args and secrets
- Scan images for vulnerabilities
- Optimize image size (layer caching, .dockerignore)
- Support multiple architectures (multi-arch builds)

### Docker Run
**Purpose:** Run containers with proper configuration.
**Agents:** Docker Engineer, DevOps Engineer, QA Tester.
**Capabilities:**
- Run containers with resource limits (CPU, memory)
- Set environment variables and secrets
- Mount volumes (with safety checks)
- Configure networks
- Set health checks
- Map ports
- Run in detached mode
- Stream logs
- Execute commands inside running containers
- Copy files in/out of containers

### Docker Compose
**Purpose:** Multi-container orchestration for development and testing.
**Agents:** Docker Engineer, DevOps Engineer.
**Capabilities:**
- Write docker-compose.yml for multi-service apps
- Define services, networks, volumes
- Manage dependencies (depends_on)
- Set up health checks
- Configure environment files
- Scale services
- Manage lifecycle (up, down, restart)

### Kubernetes Orchestration
**Purpose:** Production-grade container orchestration.
**Agents:** Kubernetes Architect, DevOps Engineer, SRE.
**Capabilities:**
- Write K8s manifests (Deployments, Services, Ingress, ConfigMaps, Secrets)
- Configure HPA/VPA for auto-scaling
- Set up network policies
- Configure RBAC
- Implement Pod Security Standards
- Set up GitOps (ArgoCD/Flux)
- Design multi-cluster architecture
- Configure service mesh (Istio/Linkerd)
- Set up disaster recovery

### Container Security
**Purpose:** Ensure containers are secure.
**Agents:** Security Analyst, Docker Engineer.
**Capabilities:**
- Scan images for vulnerabilities (Trivy, Grype)
- Enforce least privilege (non-root user, read-only filesystem)
- Use distroless/minimal base images
- Implement image signing (Cosign)
- Enforce admission controllers (OPA/Gatekeeper)
- Audit container runtime
- Network segmentation

### Container Cleanup
**Purpose:** Remove unused containers, images, and resources.
**Agents:** Docker Engineer, DevOps Engineer.
**Capabilities:**
- Stop and remove containers
- Remove unused images (dangling + all unused)
- Prune networks and volumes
- Clean up build cache
- Remove orphaned resources
- Schedule periodic cleanup

---

## RECOMMENDED GPT ACTIONS (OpenAPI)

Configure these as Custom GPT Actions using the included OpenAPI schema file. Each action extends the swarm with an external capability.

### 1. Web Scraper
**Purpose:** Extract structured data from any URL (beyond what web search returns).
**Use case:** Competitor pricing pages, news articles, public datasets.
**Config:** See `SwarmNexus_OpenAPI_Schema.yaml` → `/scrape` endpoint.

### 2. Knowledge Base Search
**Purpose:** Search your private knowledge base (Notion, Confluence, or custom).
**Use case:** Internal docs, past projects, company wiki.
**Config:** Point the action URL to your knowledge base API.

### 3. Code Execution Sandbox
**Purpose:** Run code in a real sandbox (not just Python in ChatGPT).
**Use case:** Running tests, building apps, executing multi-file projects.
**Config:** Connect to a service like E2B, Modal, or your own Railway service.

### 4. Database Query
**Purpose:** Query your Supabase or PostgreSQL database directly.
**Use case:** Pull live data for analysis, generate reports from production data.
**Config:** Use a thin API layer (never expose DB credentials to the GPT).

### 5. Calendar & Email (Google Workspace)
**Purpose:** Read calendar, send emails, create events.
**Use case:** Scheduling, outreach, meeting prep.
**Config:** Connect via Google Workspace API with OAuth.

### 6. GitHub Integration
**Purpose:** Read repos, create issues, open PRs.
**Use case:** Code analysis from live repos, issue creation from swarm findings.
**Config:** GitHub API with a fine-grained PAT.

### 7. Slack Notification
**Purpose:** Post swarm results to a Slack channel.
**Use case:** Team alerts, async updates on long-running swarms.
**Config:** Slack incoming webhook.

### 8. Image OCR
**Purpose:** Extract text from images and screenshots.
**Use case:** Analyze UI screenshots, scanned documents, whiteboard photos.
**Config:** Use a vision-capable API endpoint.

### 9. Browser Automation
**Purpose:** Full browser control — navigate, click, type, screenshot.
**Use case:** Web automation, UI testing, data extraction from interactive sites.
**Config:** Connect to a browser automation service (Playwright, Puppeteer, Browserless).
**Endpoints:** See OpenAPI schema → `/browser/navigate`, `/browser/click`, `/browser/type`, `/browser/screenshot`, `/browser/extract`.

### 10. Desktop Automation
**Purpose:** Control desktop applications — open apps, use shortcuts, manage files.
**Use case:** Desktop RPA, file operations, application control.
**Config:** Connect to a desktop automation service (nut.js, RobotJS, or custom).
**Endpoints:** See OpenAPI schema → `/desktop/open-app`, `/desktop/shortcut`, `/desktop/click`, `/desktop/type`, `/desktop/screenshot`.

### 11. Docker Build
**Purpose:** Build Docker images from Dockerfiles.
**Use case:** Containerization, image building.
**Config:** Connect to a Docker host or remote build service.
**Endpoints:** See OpenAPI schema → `/docker/build`.

### 12. Docker Run
**Purpose:** Run Docker containers with configuration.
**Use case:** Running services, integration tests, sandboxes.
**Config:** Connect to a Docker host.
**Endpoints:** See OpenAPI schema → `/docker/run`, `/docker/logs`, `/docker/stop`, `/docker/exec`.

### 13. Docker Compose
**Purpose:** Multi-container orchestration.
**Use case:** Local development environments, integration test stacks.
**Config:** Connect to a Docker host with Compose installed.
**Endpoints:** See OpenAPI schema → `/docker/compose-up`, `/docker/compose-down`.

### 14. Kubernetes Deploy
**Purpose:** Deploy to Kubernetes clusters.
**Use case:** Production deployments, scaling, rollouts.
**Config:** Connect to a K8s API server with a service account token.
**Endpoints:** See OpenAPI schema → `/k8s/apply`, `/k8s/status`, `/k8s/scale`, `/k8s/rollback`.

### 15. File System
**Purpose:** Read, write, and manage files.
**Use case:** File operations, report generation, config management.
**Config:** Connect to a file system service or sandbox.
**Endpoints:** See OpenAPI schema → `/fs/read`, `/fs/write`, `/fs/list`, `/fs/mkdir`, `/fs/search`.

### 16. Shell Execution
**Purpose:** Execute shell commands in a sandbox.
**Use case:** Running scripts, system operations, devops tasks.
**Config:** Connect to a sandbox with shell access (E2B, Modal, custom).
**Endpoints:** See OpenAPI schema → `/shell/exec`.

### 17. Speech Generation (TTS)
**Purpose:** Convert text to speech audio.
**Use case:** Voiceovers, accessibility, audio content.
**Config:** Use OpenAI TTS or compatible API.
**Endpoints:** See OpenAPI schema → `/tts`.

### 18. Video Generation
**Purpose:** Generate videos from text prompts.
**Use case:** Marketing videos, social content, demos.
**Config:** Use a video generation API (Runway, Pika, Sora-compatible).
**Endpoints:** See OpenAPI schema → `/video/generate`.

### 19. Vector Search / RAG
**Purpose:** Semantic search over your knowledge base for RAG.
**Use case:** Grounding LLM responses in your private data.
**Config:** Connect to a vector DB (Pinecone, Weaviate, pgvector).
**Endpoints:** See OpenAPI schema → `/vector/search`, `/vector/upsert`.

### 20. Webhook / Notification
**Purpose:** Send notifications to any webhook (Slack, Discord, Teams, custom).
**Use case:** Alerts, async updates, integrations.
**Config:** Point to your webhook URL.
**Endpoints:** See OpenAPI schema → `/notify/webhook`.

---

## SKILL DEFINITIONS (EXPANDED)

Skills are reusable capabilities that any agent can invoke. They are defined as structured prompts.

### Skill: SWOT Analysis
```
INPUT: A subject (company, product, decision).
PROCESS:
  1. Strengths: internal, positive, controllable.
  2. Weaknesses: internal, negative, controllable.
  3. Opportunities: external, positive, uncontrollable.
  4. Threats: external, negative, uncontrollable.
OUTPUT: 4-quadrant table with 3-5 items per quadrant. One-line strategic takeaway.
```

### Skill: RICE Prioritization
```
INPUT: A list of features or initiatives.
PROCESS: Score each on:
  R — Reach (how many users, per period)
  I — Impact (0.25 minor, 0.5 medium, 1 major, 2 massive)
  C — Confidence (0.5 low, 0.8 medium, 1 high)
  E — Effort (person-months)
  Score = (R × I × C) / E
OUTPUT: Sorted table, top 3 recommended.
```

### Skill: Five Whys (Root Cause)
```
INPUT: A problem statement.
PROCESS: Ask "why?" 5 times, each answer feeding the next.
OUTPUT: Root cause + recommended fix.
```

### Skill: MECE Decomposition
```
INPUT: A complex problem.
PROCESS: Break into Mutually Exclusive, Collectively Exhaustive sub-problems.
OUTPUT: Tree structure, each leaf is an atomic task assignable to an agent.
```

### Skill: Pre-Mortem
```
INPUT: A plan or decision.
PROCESS: "Assume this failed spectacularly 6 months from now. Why?"
OUTPUT: Top 5 failure modes, each with a mitigation.
```

### Skill: Jobs-to-be-Done
```
INPUT: A product or feature.
PROCESS: "When [situation], I want to [motivation], so I can [expected outcome]."
OUTPUT: 3-5 JTBD statements, mapped to features.
```

### Skill: Porter's Five Forces
```
INPUT: An industry or market.
PROCESS: Assess each force (rivalry, suppliers, buyers, substitutes, new entrants).
OUTPUT: 5-row table with strength rating and implication.
```

### Skill: Decision Matrix
```
INPUT: Options + criteria.
PROCESS: Score each option against each criterion (1-5), weight criteria, sum.
OUTPUT: Matrix table + recommended option.
```

### Skill: Lean Canvas
```
INPUT: A business idea.
PROCESS: Fill the 9 blocks (problem, solution, key metrics, UVP, unfair advantage, channels, customer segments, cost structure, revenue streams).
OUTPUT: Lean Canvas table + one-line pitch.
```

### Skill: AAR (After Action Review)
```
INPUT: A completed project or incident.
PROCESS:
  1. What was supposed to happen?
  2. What actually happened?
  3. Why was there a gap?
  4. What can we learn?
OUTPUT: 4-section report with actionable learnings.
```

### Skill: OODA Loop
```
INPUT: A dynamic situation requiring rapid decisions.
PROCESS: Observe → Orient → Decide → Act.
OUTPUT: Rapid decision cycle with observations and actions logged.
```

### Skill: Eisenhower Matrix
```
INPUT: A list of tasks.
PROCESS: Categorize by urgency vs importance into 4 quadrants.
OUTPUT: 4-quadrant table with tasks assigned.
```

### Skill: MoSCoW Prioritization
```
INPUT: A list of requirements.
PROCESS: Categorize as Must, Should, Could, Won't.
OUTPUT: 4-category table with rationale.
```

### Skill: Cost-Benefit Analysis
```
INPUT: A decision with costs and benefits.
PROCESS: Quantify all costs and benefits. Calculate net benefit and ROI.
OUTPUT: Table with NPV, ROI, and recommendation.
```

### Skill: Risk Matrix
```
INPUT: A list of risks.
PROCESS: Rate each by probability (1-5) and impact (1-5). Plot on matrix.
OUTPUT: Matrix with risks plotted, top 3 to mitigate.
```

### Skill: User Story Mapping
```
INPUT: A product concept.
PROCESS: Map user activities → steps → stories. Organize by release.
OUTPUT: Story map with releases marked.
```

### Skill: Threat Modeling (STRIDE)
```
INPUT: A system design.
PROCESS: Assess Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.
OUTPUT: 6-category threat list with mitigations.
```

### Skill: BLUF (Bottom Line Up Front)
```
INPUT: Any analysis or report.
PROCESS: Lead with the single most important takeaway. Then evidence. Then detail.
OUTPUT: One-line BLUF, then full report.
```

### Skill: Pyramid Principle
```
INPUT: A complex argument.
PROCESS: Start with the conclusion. Group supporting points into 3 (max 4) pillars. Each pillar has evidence.
OUTPUT: Pyramid structure: conclusion → pillars → evidence.
```

### Skill: First Principles Thinking
```
INPUT: A problem or assumption.
PROCESS: Break down to fundamental truths. Build up from there.
OUTPUT: List of first principles, then derived conclusions.
```

### Skill: Six Thinking Hats
```
INPUT: A decision or problem.
PROCESS: Examine from 6 perspectives: White (facts), Red (emotions), Black (risks), Yellow (benefits), Green (creativity), Blue (process).
OUTPUT: 6-perspective analysis.
```

### Skill: SCQA Framework
```
INPUT: A situation requiring communication.
PROCESS: Situation → Complication → Question → Answer.
OUTPUT: Structured narrative following SCQA.
```

---

## PLUGIN RECOMMENDATIONS

These are GPT plugins (from the GPT Store) that extend the swarm:

| Plugin | Extends | Use Case |
|--------|---------|----------|
| WebPilot | Web Researcher | Read full page content from any URL |
| ScholarAI | Web Researcher | Search academic papers |
| Wolfram | Data Analyst | Advanced math, physics, computational knowledge |
| Zapier | All agents | Connect to 5,000+ apps (email, CRM, sheets) |
| Canva | Visual Designer | Generate designs and graphics |
| Klarna | Shopping | Product comparison and shopping |
| Kayak | Travel | Travel planning and booking |
| Instacart | Shopping | Grocery ordering |
| Consensus | Fact-Checker | Scientific consensus on topics |
| AskYourPDF | Legal Analyst | Ask questions of PDF documents |
| Video Insights | Video Producer | Summarize video content |
| Speechki | Video Producer | Text-to-speech with multiple voices |

---

## CAPABILITY MATRIX (MAX)

| Capability | Native | Via Action | Via Plugin |
|-----------|--------|------------|-----------|
| Web search | ✅ | — | — |
| Code execution (Python) | ✅ | — | — |
| Image generation | ✅ | — | — |
| File processing | ✅ | — | — |
| Vision (image understanding) | ✅ | — | — |
| Web scraping | limited | ✅ | ✅ WebPilot |
| Browser automation | ❌ | ✅ | limited |
| Desktop automation | ❌ | ✅ | — |
| Docker build | ❌ | ✅ | — |
| Docker run | ❌ | ✅ | — |
| Docker compose | ❌ | ✅ | — |
| Kubernetes deploy | ❌ | ✅ | — |
| File system | ❌ | ✅ | — |
| Shell execution | ❌ | ✅ | — |
| Database query | ❌ | ✅ | — |
| Email/calendar | ❌ | ✅ | ✅ Zapier |
| GitHub | ❌ | ✅ | — |
| Slack | ❌ | ✅ | ✅ Zapier |
| Academic search | ❌ | ✅ | ✅ ScholarAI |
| Advanced math | limited | — | ✅ Wolfram |
| Design creation | limited | — | ✅ Canva |
| Speech generation (TTS) | ❌ | ✅ | ✅ Speechki |
| Video generation | ❌ | ✅ | ✅ Video Insights |
| Vector search / RAG | ❌ | ✅ | — |
| Webhook / notification | ❌ | ✅ | ✅ Zapier |
| OCR | ❌ | ✅ | ✅ AskYourPDF |

---

## CONFIGURATION GUIDE

### Setting Up Actions
1. In your Custom GPT, go to **Create a GPT** → **Configure**.
2. Scroll to **Actions** → **Create new action**.
3. Import the `SwarmNexus_OpenAPI_Schema.yaml` file.
4. For each action, set the API endpoint URL and authentication.
5. Test each action before going live.
6. For computer use (browser/desktop), connect to a browser automation service (Playwright, Browserless, or custom).
7. For Docker, connect to a Docker host or remote build service.
8. For K8s, connect to your cluster API server with a service account token.

### Setting Up Knowledge Files
Upload these files to the GPT's **Knowledge** section:
1. `SwarmNexus_Instructions.md` (also paste into the Instructions field)
2. `SwarmNexus_Agent_Library.md`
3. `SwarmNexus_Workflows.md`
4. `SwarmNexus_Skills_Capabilities.md` (this file)
5. `SwarmNexus_Architecture.md`
6. `SwarmNexus_Computer_Use.md` (computer use protocols)
7. `SwarmNexus_Docker_Orchestration.md` (Docker/K8s protocols)
8. `SwarmNexus_Persistence_Memory.md` (memory and state management)

### Setting Up Conversation Starters
Add these to the GPT:
1. "Research [topic] and give me a full report"
2. "Review this code and suggest improvements"
3. "Build a competitive battlecard for [company]"
4. "Create a launch plan for [product]"
5. "Analyze this data and find insights"
6. "Dockerize and deploy [project]"
7. "Scrape [website] and extract the data"
8. "Build a full-stack app for [idea], end-to-end"
9. "Set up a Kubernetes cluster for [system]"
10. "Run a security penetration test on [target]"
11. "Build an MLOps pipeline for [model]"
12. "Migrate [system] to [cloud]"

### Recommended GPT Settings
- **Name:** SwarmNexus
- **Description:** Maximum-capability multi-agent swarm intelligence. 50+ agents, 24+ workflows, full computer use, Docker orchestration, persistent memory, end-to-end missions from research to deployment.
- **Capabilities:** ✅ Web Browsing, ✅ Code Interpreter, ✅ DALL-E, ✅ File Upload, ✅ Vision
- **Model:** GPT-4o (or latest available)
- **Actions:** Import all from OpenAPI schema for maximum capability
- **Knowledge:** Upload all 8 knowledge files