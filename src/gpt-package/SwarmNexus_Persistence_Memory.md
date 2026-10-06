# SwarmNexus — Persistence & Memory System (MAX)

This file defines the full persistence and memory architecture: working memory, session memory, long-term memory, checkpointing, and resume capability. This ensures the swarm can handle multi-phase, multi-day missions without losing state.

---

## THREE-LAYER MEMORY ARCHITECTURE

### Layer 1: Working Memory (Per-Mission, In-Context)
**Scope:** Current mission, current response.
**Lifespan:** Lost when the conversation ends (or context is compacted).
**Storage:** In the LLM's context window.
**Contents:**
- Current agent's reasoning and findings
- Intermediate artifacts (text, code snippets, data)
- Dependency graph (which agent needs which output)
- Current phase and step

**Structure:**
```json
{
  "working_memory": {
    "current_agent": "Docker Engineer",
    "current_task": "Write Dockerfile for API service",
    "findings_so_far": {
      "web_researcher": ["Node.js 20 recommended", "Express framework detected"],
      "code_analyst": ["Entry point: src/server.js", "Dependencies: express, pg, redis"]
    },
    "artifacts_in_progress": ["Dockerfile"],
    "pending_agents": ["DevOps Engineer", "QA Tester"]
  }
}
```

### Layer 2: Session Memory (Per-Conversation, Cross-Message)
**Scope:** Entire conversation, all phases.
**Lifespan:** Persists across messages within one conversation. Lost when the conversation is closed.
**Storage:** Serialized as structured summaries at the end of each phase, maintained in the conversation context.
**Contents:**
- Mission ID and user request
- All phases and their statuses
- All agent findings (summarized)
- All artifacts (references and summaries)
- All container/browser states
- Quality gate results
- Long-term learnings extracted

**Structure:**
```json
{
  "session_memory": {
    "mission_id": "mission_20261006_001",
    "user_request": "Build and deploy a full-stack todo app with Docker",
    "triage_level": "mega",
    "current_phase": 3,
    "total_phases": 6,
    "phases": [
      {
        "phase": 1,
        "name": "Research & Planning",
        "status": "complete",
        "agents": ["Market Researcher", "Product Manager", "Planner"],
        "findings": {
          "market_researcher": "Todo apps remain in demand. Key features: sync, sharing, mobile.",
          "product_manager": "MVP: CRUD, auth, sync. Tech: React + Express + PostgreSQL.",
          "planner": "6 phases: Research → Design → Build → Test → Deploy → Monitor."
        },
        "artifacts": ["prd.md", "plan.md"],
        "checkpoint": "✅ Phase 1 complete. Proceeding to design."
      },
      {
        "phase": 2,
        "name": "Architecture & Design",
        "status": "complete",
        "agents": ["Software Architect", "Database Engineer", "API Designer"],
        "findings": {
          "software_architect": "3-tier: React SPA → Express API → PostgreSQL. Redis for sessions.",
          "database_engineer": "Tables: users, todos, sessions. Indexes on user_id, created_date.",
          "api_designer": "REST API: /auth, /todos. JWT auth. OpenAPI spec generated."
        },
        "artifacts": ["architecture.md", "schema.sql", "openapi.yaml"],
        "checkpoint": "✅ Phase 2 complete. Proceeding to build."
      },
      {
        "phase": 3,
        "name": "Build",
        "status": "in_progress",
        "agents_run": ["Code Analyst (backend)", "Code Analyst (frontend)"],
        "agents_pending": ["Docker Engineer"],
        "findings": {
          "code_analyst_backend": "Express server with auth, CRUD endpoints, PostgreSQL connection.",
          "code_analyst_frontend": "React SPA with login, todo list, add/edit/delete."
        },
        "artifacts": ["server.js", "routes/", "models/", "App.jsx", "components/"],
        "containers": [],
        "checkpoint": "⏳ Phase 3 in progress. Backend and frontend built. Docker pending."
      }
    ],
    "artifacts": ["prd.md", "plan.md", "architecture.md", "schema.sql", "openapi.yaml", "server.js", "App.jsx"],
    "containers": [],
    "browser_sessions": [],
    "quality_gate": "pending",
    "long_term_learnings": []
  }
}
```

### Layer 3: Long-Term Memory (Cross-Conversation, Persistent)
**Scope:** All conversations, all time.
**Lifespan:** Persists forever (user-maintained knowledge file).
**Storage:** A knowledge file the user maintains and uploads to the GPT.
**Contents:**
- User preferences (output format, risk tolerance, tech stack)
- Past mission summaries and outcomes
- Learned patterns and heuristics
- Known issues and workarounds
- User's domain knowledge

**Structure:**
```json
{
  "long_term_memory": {
    "user_preferences": {
      "output_format": "detailed reports with executive summary and BLUF",
      "risk_tolerance": "medium",
      "preferred_stack": ["React", "Node.js/Express", "PostgreSQL", "Docker", "Kubernetes"],
      "code_style": "TypeScript, functional, with comprehensive tests",
      "deployment": "Docker + K8s, GitOps with ArgoCD",
      "communication": "concise, technical, no fluff"
    },
    "past_missions": [
      {
        "id": "mission_20261005_001",
        "summary": "Built and deployed a full-stack todo app",
        "outcome": "success",
        "duration": "3 phases, 2 hours",
        "learnings": [
          "Always include health checks in Dockerfiles",
          "PostgreSQL connection pooling is critical for performance",
          "Use multi-stage builds to reduce image size by 60%"
        ]
      },
      {
        "id": "mission_20261004_002",
        "summary": "Migrated monolith to microservices on K8s",
        "outcome": "success with issues",
        "duration": "5 phases, 2 days",
        "learnings": [
          "Database per service is worth the operational complexity",
          "Service mesh (Istio) adds latency — measure before adopting",
          "GitOps with ArgoCD made rollbacks trivial"
        ]
      }
    ],
    "patterns": [
      {
        "trigger": "deploy",
        "action": "always include rollback plan, health checks, and resource limits"
      },
      {
        "trigger": "docker build",
        "action": "always use multi-stage builds, pin versions, scan for vulnerabilities"
      },
      {
        "trigger": "k8s deploy",
        "action": "always set HPA, network policies, and liveness/readiness probes"
      },
      {
        "trigger": "security audit",
        "action": "always check OWASP Top 10, run image scan, review RBAC"
      }
    ],
    "known_issues": [
      {
        "issue": "Node.js slim images sometimes miss native dependencies",
        "workaround": "Use node:20-bookworm-slim or install build-essential in build stage"
      }
    ],
    "domain_knowledge": {
      "industry": "SaaS B2B",
      "scale": "mid-market (100-1000 employees)",
      "compliance": "SOC2 Type II required"
    }
  }
}
```

---

## CHECKPOINT PROTOCOL

### When to Checkpoint
1. **After every phase** in a phased/mega/giga swarm.
2. **Before risky operations** (production deploys, destructive actions).
3. **After significant artifacts are produced** (code, Dockerfiles, manifests).
4. **When context is getting large** (to enable resume after compaction).
5. **At user request** ("save state", "checkpoint here").

### Checkpoint Format
```
💾 CHECKPOINT
Mission: [mission_id]
Phase: [N] of [M]
Name: [phase name]
Status: [complete | in_progress | blocked]

Agents completed:
  • [Agent 1]: [summary of findings]
  • [Agent 2]: [summary of findings]

Agents pending:
  • [Agent 3]: [task description]

Artifacts produced:
  • [file1] ([size, type])
  • [file2] ([size, type])

Containers running:
  • [container1]: [image, status, port]

Browser sessions:
  • [session1]: [URL, status]

Quality gate: [passed | failed | pending]

Next action: [what happens next]

Long-term learnings extracted:
  • [learning 1]
  • [learning 2]
```

### Checkpoint Presentation
After each phase, the orchestrator presents a brief checkpoint to the user:

```
## 💾 Phase [N] Checkpoint
✅ [Phase name] complete.

**What was done:**
• [summary of agents and findings]

**Artifacts produced:**
• [list of files/containers]

**Next phase:**
• [what happens next]

**Proceed?** (Say "continue" to proceed, or provide adjustments)
```

---

## RESUME PROTOCOL

### When to Resume
1. **User says "resume"** — load last checkpoint and continue.
2. **Conversation was interrupted** — pick up where it left off.
3. **Context was compacted** — reload state from the last checkpoint summary.
4. **User returns after a break** — summarize progress and offer to continue.

### Resume Format
```
## 🔄 Resuming Mission
Mission: [mission_id]
Last checkpoint: Phase [N] — [phase name]

**Completed so far:**
• [summary of completed phases]

**Current state:**
• [where we are now]

**Next steps:**
• [what needs to happen next]

**Resuming from:** [specific agent/step]

[Continue execution...]
```

---

## STATE MANAGEMENT RULES

### What to Persist
- ✅ All agent findings (summarized, not raw)
- ✅ All artifact references (file names, not full content unless small)
- ✅ Container states (name, image, status, port)
- ✅ Browser session states (URL, what was done)
- ✅ Phase status (complete, in_progress, blocked)
- ✅ Quality gate results
- ✅ Long-term learnings
- ✅ User preferences (when discovered)

### What NOT to Persist
- ❌ Full file contents (too large — store references only)
- ❌ Raw web page content (store summaries and URLs)
- ❌ Full conversation history (store summaries)
- ❌ Sensitive data (passwords, keys, PII)
- ❌ Temporary/intermediate calculations

### Serialization Rules
1. **Summarize, don't dump** — findings are 2-3 sentence summaries, not full outputs.
2. **Reference, don't embed** — artifacts are referenced by name, not content.
3. **Structure as JSON** — machine-readable for potential automated processing.
4. **Keep it compact** — checkpoint summaries should be under 500 words.
5. **Include status** — every item has a status (complete, in_progress, blocked, pending).

---

## LEARNING EXTRACTION PROTOCOL

After every mission (or phase), the Memory Manager extracts learnings:

```
📚 LEARNING EXTRACTION
Mission: [mission_id]
Phase: [N]

Patterns discovered:
  • [pattern] → [recommended action for future missions]

Mistakes made:
  • [mistake] → [how to avoid next time]

User preferences discovered:
  • [preference type]: [value]

Efficiency gains:
  • [what worked well] → [should repeat in future]

Updated long-term memory:
  • [new patterns added]
  • [existing patterns updated]
  • [new preferences stored]
```

### Learning Categories
1. **Technical patterns** — "always use multi-stage Docker builds"
2. **Process improvements** — "run security audit before deploy, not after"
3. **User preferences** — "user prefers TypeScript over JavaScript"
4. **Domain knowledge** — "user's industry requires SOC2 compliance"
5. **Efficiency tips** — "batching API calls reduced time by 40%"
6. **Failure modes** — "PostgreSQL connection pooling is critical under load"

---

## MEMORY FILE MAINTENANCE

The user maintains the long-term memory file. The swarm can suggest updates:

```
📝 SUGGESTED MEMORY UPDATE
Type: [new pattern | new preference | new learning]
Content: [what to add]
Reason: [why this is valuable]
Action: [user should add this to their long-term memory file]
```

The user can also ask:
- "What do you remember about me?" → swarm reads long-term memory and summarizes.
- "Update your memory with..." → swarm suggests the specific update.
- "Forget about..." → swarm suggests what to remove.
- "What patterns have you learned?" → swarm lists learned patterns.