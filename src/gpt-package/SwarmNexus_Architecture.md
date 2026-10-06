# SwarmNexus — Architecture Specification (MAX)

## OVERVIEW
SwarmNexus is a maximum-capability single-LLM multi-agent simulation framework. Instead of calling multiple model instances, it uses structured prompting to make one ChatGPT instance behave as a coordinated team of 50+ specialist agents with computer use, Docker orchestration, and persistent memory.

## DESIGN PHILOSOPHY
1. **One model, many roles** — The LLM role-plays as different specialists using system-prompt switching.
2. **Structured delimiters** — Agent outputs are visually separated so the user can follow the "team" working.
3. **Parallel simulation** — Independent agents are written in the same response, creating perceived parallel execution.
4. **Synthesis over concatenation** — The final output is integrated, not just stitched together.
5. **Quality gates** — Every mission ends with a comprehensive self-check before the answer is delivered.
6. **Persistence by default** — All mission state is checkpointed for resume capability.
7. **Computer use when needed** — Agents can operate browsers and desktops for real-world interaction.
8. **Docker orchestration** — Agents can build, run, and orchestrate containers for deployment.
9. **End-to-end completion** — Missions don't stop at partial; they go from idea to deployed and verified.
10. **Maximum parallelism** — Every independent subtask runs concurrently.

---

## SYSTEM ARCHITECTURE (MAX)

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER REQUEST                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   TRIAGE LAYER  │
                  │  (simple? mod?  │
                  │ complex? mega?  │
                  │    giga?)       │
                  └───────┬────────┘
                          │
           ┌──────────────┴──────────────┐
           ▼                             ▼
     ┌──────────┐              ┌───────────────┐
     │ DIRECT   │              │  PLANNER      │
     │ ANSWER   │              │ (MECE decompose)│
     └──────────┘              └───────┬───────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  DISPATCH      │
                              │  (assign 50+   │
                              │   agents)      │
                              └───────┬────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                ▼                     ▼                     ▼
          ┌──────────┐         ┌──────────┐         ┌──────────┐
          │ Agent 1  │         │ Agent 2  │  ...    │ Agent N  │
          │(parallel)│         │(parallel)│         │(parallel)│
          └────┬─────┘         └────┬─────┘         └────┬─────┘
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    ▼
                         ┌────────────────────┐
                         │  DEPENDENCY CHECK   │
                         │  + PERSISTENCE      │
                         │  (checkpoint)       │
                         └─────────┬──────────┘
                                   │
                        ┌──────────┴──────────┐
                        ▼                     ▼
                  ┌──────────┐        ┌──────────────┐
                  │ RE-DISPATCH│       │  SYNTHESIZE  │
                  │ (if blocked)│      │  (merge all)  │
                  └──────────┘        └──────┬───────┘
                                              │
                                              ▼
                                   ┌────────────────────┐
                                   │  QUALITY GATE (MAX) │
                                   │  (10-point check)  │
                                   └─────────┬──────────┘
                                             │
                                    ┌────────┴────────┐
                                    ▼                 ▼
                               ┌────────┐      ┌──────────┐
                               │ PASS ✅ │      │ FAIL ⚠  │
                               └───┬────┘      └────┬─────┘
                                   │                │
                                   ▼                ▼
                         ┌──────────────┐   ┌──────────────┐
                         │ PERSIST TO   │   │ RE-DISPATCH  │
                         │ LONG-TERM    │   │ (fix issues) │
                         │ MEMORY       │   └──────────────┘
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ FINAL OUTPUT  │
                         │  (to user)    │
                         └──────────────┘
```

---

## AGENT EXECUTION MODEL

### Single-Agent Execution (within one ChatGPT response)
```
┌─────────────────────────────────────────────────┐
│ AGENT CONTEXT WINDOW                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ Agent System Prompt (role + rules)            │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Task Description                             │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Input Data (from deps or user)               │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Tool Calls:                                  │ │
│ │   • Search, Code, DALL-E (native)             │ │
│ │   • Browser, Desktop (computer use)          │ │
│ │   • Docker, K8s (container ops)               │ │
│ │   • DB, GitHub, Slack, Email (actions)       │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Reasoning & Work (chain-of-thought)          │ │
│ ├─────────────────────────────────────────────┤ │
│ │ FINDINGS (3-5 bullets)                        │ │
│ ├─────────────────────────────────────────────┤ │
│ │ PERSIST directive (💾 key = value)            │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Parallel Simulation
Multiple agents are written in the same response, separated by delimiters. This is **simulated parallelism** — the model generates each agent's output sequentially but presents them as concurrent.

### True Parallelism (with Actions)
When GPT Actions are configured, agents can make real API calls that execute concurrently:
- Agent 1 calls Browser Automation Action
- Agent 2 calls Database Query Action
- Agent 3 calls Docker Build Action
- Agent 4 calls GitHub Action
These run in parallel on the server side.

---

## COMPUTER USE ARCHITECTURE

```
┌──────────────────────────────────────────────────┐
│              COMPUTER USE LAYER                   │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌────────────────┐    ┌────────────────┐        │
│  │ BROWSER AGENT   │    │ DESKTOP AGENT   │        │
│  │                 │    │                 │        │
│  │ • Navigate      │    │ • Open App      │        │
│  │ • Click         │    │ • Shortcuts     │        │
│  │ • Type          │    │ • Click (x,y)   │        │
│  │ • Scroll        │    │ • Type          │        │
│  │ • Screenshot    │    │ • Screenshot    │        │
│  │ • Extract      │    │ • File Ops      │        │
│  │ • JavaScript    │    │ • Shell         │        │
│  └───────┬────────┘    └───────┬────────┘        │
│          │                     │                  │
│          └──────────┬──────────┘                  │
│                     ▼                             │
│          ┌────────────────┐                       │
│          │  VISION LAYER   │                       │
│          │  (screenshot    │                       │
│          │   analysis +    │                       │
│          │   verification) │                       │
│          └────────────────┘                       │
└──────────────────────────────────────────────────┘
```

### Computer Use Flow
```
1. Agent receives task → determines if browser or desktop needed
2. Agent sends action command (navigate, click, type, etc.)
3. Action executes via API (Playwright, Browserless, nut.js)
4. Screenshot captured → returned to agent
5. Agent uses vision to verify expected state
6. If verified → proceed to next action
7. If not → adjust and retry (max 3 attempts)
8. All actions logged for audit trail
```

---

## DOCKER ORCHESTRATION ARCHITECTURE

```
┌──────────────────────────────────────────────────┐
│              DOCKER LAYER                         │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ BUILD    │  │ RUN      │  │ COMPOSE      │    │
│  │          │  │          │  │              │    │
│  │ Docker-  │  │ docker   │  │ docker-      │    │
│  │ file →   │  │ run      │  │ compose     │    │
│  │ Image    │  │ -d ...   │  │ up -d       │    │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │             │               │            │
│       └─────────────┼───────────────┘            │
│                     ▼                            │
│          ┌────────────────┐                      │
│          │  KUBERNETES    │                      │
│          │  ORCHESTRATION │                      │
│          │                │                      │
│          │ • kubectl      │                      │
│          │ • HPA/VPA      │                      │
│          │ • Ingress      │                      │
│          │ • Network Pol  │                      │
│          │ • GitOps       │                      │
│          └───────┬────────┘                      │
│                  │                               │
│                  ▼                               │
│          ┌────────────────┐                      │
│          │  CLEANUP        │                      │
│          │  (always)      │                      │
│          │ • stop/rm       │                      │
│          │ • prune         │                      │
│          │ • rmi           │                      │
│          └────────────────┘                      │
└──────────────────────────────────────────────────┘
```

### Docker Lifecycle
```
1. Docker Engineer writes Dockerfile (multi-stage, optimized)
2. Build image (docker build -t name:tag .)
3. Scan image for vulnerabilities
4. Run container (docker run -d with limits, health checks)
5. Verify health (docker inspect, curl health endpoint)
6. Stream logs (docker logs -f)
7. If compose: docker-compose up -d
8. If K8s: kubectl apply -f manifest.yaml
9. Monitor (kubectl get pods, logs, metrics)
10. CLEANUP: docker stop, rm, rmi, prune (ALWAYS)
```

---

## PERSISTENCE & MEMORY ARCHITECTURE

```
┌──────────────────────────────────────────────────┐
│              MEMORY LAYERS                        │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │ WORKING MEMORY (per-mission, in-context)  │    │
│  │ • Current agent findings                  │    │
│  │ • Intermediate artifacts                  │    │
│  │ • Dependency graph                        │    │
│  │ • Lost when conversation ends             │    │
│  └──────────────────────────────────────────┘    │
│                     │                             │
│                     ▼                             │
│  ┌──────────────────────────────────────────┐    │
│  │ SESSION MEMORY (per-conversation)         │    │
│  │ • Phase checkpoints                       │    │
│  │ • Mission state (JSON)                    │    │
│  │ • Artifact references                     │    │
│  │ • Container states                        │    │
│  │ • Persists across messages                │    │
│  └──────────────────────────────────────────┘    │
│                     │                             │
│                     ▼                             │
│  ┌──────────────────────────────────────────┐    │
│  │ LONG-TERM MEMORY (cross-conversation)     │    │
│  │ • User preferences                        │    │
│  │ • Past mission outcomes                    │    │
│  │ • Learned patterns                         │    │
│  │ • Stored as knowledge file                 │    │
│  │ • Persists forever (user-maintained)       │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Memory State Object
```json
{
  "mission_id": "auto-generated",
  "user_request": "original prompt",
  "triage_level": "giga",
  "phase": 3,
  "plan": {
    "agents": [
      {"id": 1, "role": "Web Researcher", "task": "...", "deps": [], "status": "done", "persisted": true},
      {"id": 2, "role": "Docker Engineer", "task": "...", "deps": [1], "status": "working", "persisted": false}
    ]
  },
  "findings": {
    "1": ["finding A", "finding B"],
    "2": ["pending"]
  },
  "artifacts": ["report.md", "Dockerfile", "docker-compose.yml"],
  "containers": [{"name": "api-server", "image": "api:v1", "status": "running", "port": 8080}],
  "browser_sessions": [{"id": "sess1", "url": "https://...", "status": "active"}],
  "synthesis": null,
  "quality_gate": "pending",
  "long_term_learnings": ["always include rollback plan for deploys"]
}
```

### Checkpoint Protocol
```
After each phase:
1. Memory Manager collects all agent findings
2. Serializes state to JSON
3. Presents checkpoint summary to user
4. Saves state for resume capability
5. Proceeds to next phase (or waits for user confirmation)
```

---

## DATA FLOW

### Dependency Resolution
- An agent with `deps: []` runs immediately.
- An agent with `deps: [1]` waits for agent 1's FINDINGS.
- If a dependency agent reports `⚠ BLOCKED`, the dependent agent is reassigned or the mission is de-scoped.
- Circular dependencies are detected and broken by the Planner.

### Artifact Flow
```
Agent 1 (Web Researcher) → produces: sources.md
  ↓
Agent 2 (Data Analyst) → consumes: sources.md → produces: analysis.csv, charts/
  ↓
Agent 3 (Docker Engineer) → consumes: analysis.csv → produces: Dockerfile, image
  ↓
Agent 4 (DevOps) → consumes: Dockerfile, image → produces: deployment.yaml
  ↓
Lead Synthesizer → consumes: all → produces: final_report.md
```

---

## CAPABILITY LAYER (MAX)

```
┌──────────────────────────────────────────────────────────┐
│                    AGENT LAYER                            │
│  (50+ specialist agents, each with system prompt)        │
└────────────────────────────┬─────────────────────────────┘
                             │
      ┌──────────────────────┼──────────────────────┐
      ▼                      ▼                      ▼
┌──────────┐          ┌─────────────┐        ┌─────────────┐
│ NATIVE   │          │ ACTIONS     │        │ PLUGINS     │
│ CAPS     │          │ (API)       │        │ (Store)     │
├──────────┤          ├─────────────┤        ├─────────────┤
│ Search   │          │ Scrape      │        │ WebPilot    │
│ Code     │          │ Browser     │        │ ScholarAI   │
│ DALL-E   │          │ Desktop     │        │ Wolfram     │
│ Files    │          │ Docker      │        │ Zapier      │
│ Vision   │          │ K8s         │        │ Canva       │
│ Voice    │          │ DB Query    │        │ Consensus   │
│          │          │ GitHub      │        │ AskYourPDF  │
│          │          │ Slack       │        │ Speechki    │
│          │          │ Email       │        │ Video Ins.  │
│          │          │ Calendar    │        │             │
│          │          │ File System │        │             │
│          │          │ Shell       │        │             │
│          │          │ TTS         │        │             │
│          │          │ Video Gen   │        │             │
│          │          │ Vector/RAG  │        │             │
│          │          │ Webhook     │        │             │
│          │          │ OCR         │        │             │
└──────────┘          └─────────────┘        └─────────────┘
```

---

## SCALING MODEL (MAX)

| Mission Size | Agents | Mode | Est. Turns | Persistence | Computer Use | Docker |
|-------------|--------|------|-----------|-------------|-------------|--------|
| Simple | 0 (direct) | — | 1 | none | no | no |
| Moderate | 2–3 | parallel | 1–2 | none | maybe | no |
| Complex | 4–7 | hybrid | 2–4 | checkpoint | maybe | maybe |
| Mega | 8–15 | phased | 4–8 | full-state | likely | likely |
| Giga | 15–30 | phased-persistent | 8–20 | full + long-term | yes | yes |

### Phased Swarm (Mega)
```
Phase 1: Research (parallel) → Checkpoint review → Persist
Phase 2: Analysis (parallel) → Checkpoint review → Persist
Phase 3: Creation (parallel) → Checkpoint review → Persist
Phase 4: Synthesis + Quality Gate → Final output → Persist to long-term
```

Between phases, the orchestrator presents a brief checkpoint summary and asks the user to confirm or adjust before proceeding.

### Giga-Swarm (Multi-day)
```
Day 1: RECON & ARCHITECTURE → CHECKPOINT (persist full state)
Day 2: BUILD & TEST → CHECKPOINT (persist full state)
Day 3: DEPLOY & OPTIMIZE → FINAL SYNTHESIS → PERSIST TO LONG-TERM
```

---

## ERROR HANDLING (MAX)

| Error Type | Response |
|-----------|----------|
| Agent blocked (no data) | Reassign to different agent or de-scope |
| Contradiction between agents | Re-run both with explicit "resolve conflict" instruction |
| Quality gate fails | Re-dispatch failing agents with specific fix instructions |
| Tool unavailable | Agent reports limitation, orchestrator offers alternative |
| Request too vague | Ask 1 clarifying question, then proceed |
| Computer use action fails | Retry (max 3), then report and ask user |
| Browser captcha encountered | Flag to user, pause, ask for human intervention |
| Docker build fails | Debug, fix Dockerfile, retry. If persistent, report. |
| Container crash | Check logs, restart with fix, verify health |
| K8s pod fails | Check events, describe pod, fix manifest, redeploy |
| Dependency cycle detected | Planner breaks cycle, reassigns |
| State corruption | Load last checkpoint, resume from there |
| Long conversation context loss | Summarize prior phases, load from checkpoint |

---

## PERFORMANCE OPTIMIZATION

1. **Minimize agent count** — Don't over-decompose. 3 great agents > 7 mediocre ones.
2. **Maximize parallelism** — Identify every independent subtask and run them all at once.
3. **Short agent prompts** — Each agent should be focused, not exhaustive.
4. **Early termination** — If the synthesis is clearly sufficient, stop.
5. **Cache findings** — In long conversations, reference prior agent outputs instead of re-running.
6. **Use Actions for true parallelism** — API calls execute concurrently on the server.
7. **Checkpoint efficiently** — Don't over-persist; checkpoint at phase boundaries.
8. **Batch tool calls** — When an agent needs multiple API calls, batch them.
9. **Lazy evaluation** — Don't run agents whose findings won't be needed.
10. **Progressive synthesis** — Synthesize partial results early to catch issues.

---

## SECURITY & PRIVACY (MAX)

- **No credentials in prompts** — API keys live in GPT Actions config, never in instructions.
- **PII redaction** — Agents should not echo back sensitive user data unnecessarily.
- **Action authentication** — Use OAuth or API keys in the Actions config, never in the knowledge files.
- **Sandboxing** — Code Interpreter runs in a sandbox. For production code execution, use a dedicated sandbox Action.
- **Computer use safety** — Never submit forms on production without confirmation. Never execute financial transactions without approval.
- **Docker safety** — Never run privileged containers without approval. Never mount sensitive host paths. Always set resource limits. Always clean up.
- **Shell safety** — Never execute destructive commands without confirmation. Log all commands.
- **File safety** — Never delete files without explicit instruction. Log all file operations.
- **Network safety** — Use HTTPS only. Validate all external URLs. Don't follow redirects to unknown hosts.
- **Secret management** — Use environment variables or secrets mounts. Never hardcode secrets in Dockerfiles, code, or prompts.
- **Audit trail** — Every computer use action, Docker operation, and shell command is logged.

---

## EXTENSIBILITY

### Adding a New Agent
1. Add the agent to `SwarmNexus_Agent_Library.md` with role, prompt, tools, and persistence.
2. Update the selection quick-reference table.
3. The orchestrator will automatically consider it for future missions.

### Adding a New Workflow
1. Add the workflow to `SwarmNexus_Workflows.md`.
2. Define the trigger phrase so the orchestrator knows when to use it.
3. Specify the mode, swarm composition, and steps.

### Adding a New Skill
1. Add the skill to `SwarmNexus_Skills_Capabilities.md`.
2. Any agent can invoke any skill — no registration needed beyond the definition.

### Adding a New Action
1. Add the endpoint to `SwarmNexus_OpenAPI_Schema.yaml`.
2. Configure the action in the GPT builder.
3. Update the capability matrix in the skills file.

### Adding a New Capability Layer
1. Define the capability in the skills file.
2. Add the API endpoints to the OpenAPI schema.
3. Update the architecture diagram.
4. Create agents that specialize in the new capability.
5. Create workflows that leverage the new capability.

---

## END-TO-END LIFECYCLE COVERAGE

SwarmNexus covers the complete lifecycle of any initiative:

```
IDEA → RESEARCH → PLAN → DESIGN → BUILD → TEST → DEPLOY → MONITOR → OPTIMIZE → LEARN
  │        │        │       │       │       │       │        │          │        │
  │        │        │       │       │       │       │        │          │        └→ Long-term memory
  │        │        │       │       │       │       │        │          └→ Continuous monitoring
  │        │        │       │       │       │       │        └→ SRE + observability
  │        │        │       │       │       │       └→ DevOps + Docker + K8s
  │        │        │       │       │       └→ QA + Security + Computer Use
  │        │        │       │       └→ Code Analyst + Docker Engineer
  │        │        │       └→ Software/Backend/Frontend Architect
  │        │        └→ Planner + Product Manager
  │        └→ Market Researcher + Strategist
  └→ Web Researcher + Competitive Analyst
```

Every stage has dedicated agents, workflows, and persistence. The swarm can start at any point and carry through to completion.