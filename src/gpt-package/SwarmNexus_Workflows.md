# SwarmNexus — Predefined Workflows (24+ Workflows)

24+ battle-tested workflows. The orchestrator selects one or combines them based on the mission.

---

## WORKFLOW 1 — Deep Research Report
**Mode:** 🔶 Pipeline (Sequential)
**Swarm:** Web Researcher → Data Analyst → Fact-Checker → Technical Writer → Quality Reviewer

**Steps:**
1. **Web Researcher** — Gather sources on the topic. Minimum 5 sources.
2. **Data Analyst** — Extract and analyze any quantitative data from sources.
3. **Fact-Checker** — Verify every claim against 2+ independent sources.
4. **Technical Writer** — Structure into a report: Executive Summary → Findings → Analysis → Recommendations → Sources.
5. **Quality Reviewer** — Check completeness, accuracy, and format.

**Trigger:** "Research [topic] and give me a full report."

---

## WORKFLOW 2 — Competitive Battlecard
**Mode:** 🔶🔷 Hybrid
**Swarm (parallel group A):** Web Researcher ×3 (one per competitor) + Competitive Intelligence Analyst
**Swarm (sequential):** → Lead Synthesizer → Quality Reviewer

**Steps:**
1. **Web Researchers** (parallel) — Profile each competitor: product, pricing, positioning, recent news.
2. **Competitive Intelligence Analyst** — Build comparison matrix, identify gaps and wedges.
3. **Lead Synthesizer** — Produce battlecard: overview, comparison table, SWOT per competitor, our wedge, recommended plays.
4. **Quality Reviewer** — Verify all data is current.

**Trigger:** "Build a competitive battlecard for [our company] vs [competitors]."

---

## WORKFLOW 3 — Code Review & Refactor
**Mode:** 🔶 Pipeline
**Swarm:** Code Analyst → Security Analyst → QA Tester → Software Architect → Lead Synthesizer

**Steps:**
1. **Code Analyst** — Review for bugs, code smells, and improvement opportunities.
2. **Security Analyst** — Check for vulnerabilities (OWASP Top 10).
3. **QA Tester** — Identify untested paths, suggest test cases.
4. **Software Architect** — Evaluate architecture, suggest structural improvements.
5. **Lead Synthesizer** — Unified review: Summary → Issues (by severity) → Refactoring Plan → Test Plan.

**Trigger:** "Review this code: [code]"

---

## WORKFLOW 4 — Product Launch Plan
**Mode:** 🔶🔷 Hybrid (3 phases)
**Phase 1 (parallel):** Market Researcher + Competitive Intelligence Analyst + Product Manager
**Phase 2 (parallel):** Content Strategist + Social Media Strategist + SEO Specialist + Creative Writer
**Phase 3 (sequential):** → Lead Synthesizer → Quality Reviewer

**Steps:**
1. **Phase 1** — Market sizing, competitive landscape, product positioning.
2. **Phase 2** — Content plan, social plan, SEO plan, launch copy.
3. **Phase 3** — Unified launch playbook with timeline, owners, and KPIs.

**Trigger:** "Create a launch plan for [product]."

---

## WORKFLOW 5 — Content Creation Pipeline
**Mode:** 🔄 Iterative Loop
**Swarm:** Content Strategist → Creative Writer → Copy Editor → Quality Reviewer → (loop if needed)

**Steps:**
1. **Content Strategist** — Define topic, angle, target keyword, and outline.
2. **Creative Writer** — Draft the content.
3. **Copy Editor** — Polish grammar, flow, and clarity.
4. **Quality Reviewer** — Check against brief. If fails → back to Creative Writer.
5. **Loop** until quality gate passes (max 3 iterations).

**Trigger:** "Write [content type] about [topic]."

---

## WORKFLOW 6 — Technical Architecture Design
**Mode:** 🔶 Pipeline
**Swarm:** Software Architect → Database Engineer → Security Analyst → DevOps Engineer → Technical Writer

**Steps:**
1. **Software Architect** — System design, component diagram, technology choices.
2. **Database Engineer** — Schema design, indexing strategy.
3. **Security Analyst** — Threat model, security requirements.
4. **DevOps Engineer** — Deployment architecture, CI/CD, monitoring.
5. **Technical Writer** — Architecture Decision Record (ADR) document.

**Trigger:** "Design the architecture for [system]."

---

## WORKFLOW 7 — Due Diligence
**Mode:** 🔷 Parallel Burst
**Swarm (parallel):** Financial Analyst + Legal Analyst + Competitive Intelligence Analyst + Web Researcher + Security Analyst (tech DD)
**Sequential:** → Lead Synthesizer → Quality Reviewer

**Steps:**
1. **All agents in parallel** — Each examines the target from their angle.
2. **Lead Synthesizer** — Unified DD report with risk matrix and recommendation.
3. **Quality Reviewer** — Verify all claims are sourced.

**Trigger:** "Run due diligence on [company/target]."

---

## WORKFLOW 8 — Go-to-Market Strategy
**Mode:** 🔶🔷 Hybrid
**Phase 1 (parallel):** Business Strategist + Market Researcher + Competitive Intelligence Analyst
**Phase 2 (parallel):** Product Manager + Content Strategist + Social Media Strategist + Financial Analyst
**Phase 3:** → Lead Synthesizer

**Steps:**
1. **Phase 1** — Market analysis, competitive landscape, strategic positioning.
2. **Phase 2** — Product-market fit plan, content/social strategy, revenue model.
3. **Phase 3** — Unified GTM playbook.

**Trigger:** "Build a GTM strategy for [product] in [market]."

---

## WORKFLOW 9 — Bug Triage & Fix
**Mode:** 🔶 Pipeline
**Swarm:** Code Analyst → QA Tester → Code Analyst (fix) → QA Tester (verify)

**Steps:**
1. **Code Analyst** — Reproduce, identify root cause.
2. **QA Tester** — Write a failing test that captures the bug.
3. **Code Analyst** — Implement the fix.
4. **QA Tester** — Verify the test passes, check for regressions.

**Trigger:** "Fix this bug: [description/code]"

---

## WORKFLOW 10 — SEO Content Cluster
**Mode:** 🔶🔷 Hybrid
**Phase 1 (sequential):** SEO Specialist → Content Strategist
**Phase 2 (parallel):** Creative Writer ×N (one per article)
**Phase 3 (sequential):** Copy Editor → Quality Reviewer

**Steps:**
1. **SEO Specialist** — Keyword research, identify pillar + supporting topics.
2. **Content Strategist** — Cluster plan, internal linking strategy.
3. **Creative Writers** (parallel) — Draft each article.
4. **Copy Editor** — Polish all articles.
5. **Quality Reviewer** — Check SEO compliance and content quality.

**Trigger:** "Build an SEO content cluster around [topic]."

---

## WORKFLOW 11 — Customer Journey Optimization
**Mode:** 🔶 Pipeline
**Swarm:** UX Researcher → Operations Analyst → Customer Success Strategist → Data Analyst → Lead Synthesizer

**Steps:**
1. **UX Researcher** — Map current customer journey, identify pain points.
2. **Operations Analyst** — Identify process bottlenecks.
3. **Customer Success Strategist** — Design interventions and touchpoints.
4. **Data Analyst** — Quantify expected impact.
5. **Lead Synthesizer** — Optimization plan with prioritized initiatives.

**Trigger:** "Optimize the customer journey for [product]."

---

## WORKFLOW 12 — Crisis Response
**Mode:** 🔷 Parallel Burst (fast)
**Swarm (parallel):** Web Researcher (what happened) + Legal Analyst (legal exposure) + Creative Writer (messaging) + Business Strategist (business impact)
**Sequential:** → Lead Synthesizer

**Steps:**
1. **All agents in parallel** — Each assesses the crisis from their angle (fast, 1 pass each).
2. **Lead Synthesizer** — Crisis response plan: situation, impact, immediate actions, messaging, stakeholders.

**Trigger:** "We have a crisis: [description]. Help me respond."

---

## WORKFLOW 13 — Browser Automation & Data Extraction
**Mode:** 🖥️ Computer-Augmented
**Swarm:** Web Researcher → Computer Use Agent (Browser) → Data Analyst → Lead Synthesizer

**Steps:**
1. **Web Researcher** — Identify target URLs and data to extract.
2. **Computer Use Agent (Browser)** — Navigate to each URL, interact with pages, extract data. Screenshot before/after each action. Handle pagination, login, dynamic content.
3. **Data Analyst** — Clean, structure, and analyze extracted data. Produce charts.
4. **Lead Synthesizer** — Report with data, charts, and extraction methodology.

**Trigger:** "Extract data from [website]" or "Scrape [site] and analyze the results."

---

## WORKFLOW 14 — UI Testing via Computer Use
**Mode:** 🖥️ Computer-Augmented
**Swarm:** QA Tester → Computer Use Agent (Browser) → QA Tester (verify) → Lead Synthesizer

**Steps:**
1. **QA Tester** — Define test scenarios (happy paths, edge cases, visual checks).
2. **Computer Use Agent (Browser)** — Execute each test scenario: navigate, interact, screenshot, verify.
3. **QA Tester** — Compare screenshots to expected results. Flag failures.
4. **Lead Synthesizer** — Test report with pass/fail, screenshots, and bug reports.

**Trigger:** "Test the UI of [website/app]" or "Run UI tests on [URL]."

---

## WORKFLOW 15 — Docker Build & Deploy
**Mode:** 🐳 Container-Orchestrated
**Swarm:** Code Analyst → Docker Engineer → DevOps Engineer → QA Tester → DevOps Engineer (deploy) → SRE

**Steps:**
1. **Code Analyst** — Review code, identify dependencies and build requirements.
2. **Docker Engineer** — Write Dockerfile (multi-stage, optimized), docker-compose.yml. Build image.
3. **DevOps Engineer** — Design CI/CD pipeline (build → test → push → deploy).
4. **QA Tester** — Run tests inside container. Verify health checks.
5. **DevOps Engineer** — Deploy to staging, then production (with rollback plan).
6. **SRE** — Set up monitoring, alerts, and SLOs.
7. **Cleanup** — Remove old images, prune unused resources.

**Trigger:** "Dockerize and deploy [project]" or "Containerize [app] and ship it."

---

## WORKFLOW 16 — Kubernetes Cluster Setup
**Mode:** 🐳 Container-Orchestrated
**Swarm:** Kubernetes Architect → Cloud Architect → DevOps Engineer → Security Analyst → SRE → Technical Writer

**Steps:**
1. **Kubernetes Architect** — Design cluster topology, node pools, networking.
2. **Cloud Architect** — Provision infrastructure via IaC (Terraform).
3. **DevOps Engineer** — Write K8s manifests (Deployments, Services, Ingress, HPA).
4. **Security Analyst** — Network policies, RBAC, Pod Security Standards.
5. **SRE** — Monitoring (Prometheus/Grafana), logging (Fluentd), alerting.
6. **Technical Writer** — Cluster documentation and runbooks.

**Trigger:** "Set up a Kubernetes cluster for [project]" or "Design K8s for [system]."

---

## WORKFLOW 17 — Microservices Architecture & Deployment
**Mode:** 🐳 Container-Orchestrated + 🔶🔷 Hybrid
**Phase 1 (parallel):** Backend Architect + Database Engineer + API Designer
**Phase 2 (parallel):** Docker Engineer (per service) ×N
**Phase 3 (sequential):** DevOps Engineer → SRE → Security Analyst → Lead Synthesizer

**Steps:**
1. **Phase 1** — Design service boundaries, database per service, API contracts.
2. **Phase 2** — Dockerize each service (parallel).
3. **Phase 3** — Orchestrate with K8s/compose, set up observability, security audit, final docs.

**Trigger:** "Build a microservices architecture for [system]."

---

## WORKFLOW 18 — Security Penetration Test
**Mode:** 🔶 Pipeline + 🖥️ Computer-Augmented
**Swarm:** Security Analyst → Penetration Tester → Code Analyst → Compliance Analyst → Lead Synthesizer

**Steps:**
1. **Security Analyst** — Define scope, threat model, test plan.
2. **Penetration Tester** — Execute tests: OWASP Top 10, logic flaws, misconfigurations. Use browser automation for web tests.
3. **Code Analyst** — Source code review for vulnerabilities.
4. **Compliance Analyst** — Map findings to compliance frameworks (SOC2, GDPR).
5. **Lead Synthesizer** — Pentest report: findings (by CVSS), repro steps, remediation plan.

**Trigger:** "Pen test [system]" or "Run a security assessment on [target]."

---

## WORKFLOW 19 — Data Pipeline & Analytics Platform
**Mode:** 🔶🔷 Hybrid + 🐳 Container-Orchestrated
**Phase 1 (parallel):** Data Pipeline Engineer + Database Engineer + Data Scientist
**Phase 2 (sequential):** Docker Engineer → DevOps Engineer → SRE
**Phase 3:** Data Analyst → Lead Synthesizer

**Steps:**
1. **Phase 1** — Design ETL/ELT pipeline, schema, analytics models.
2. **Phase 2** — Containerize pipeline, deploy, set up monitoring.
3. **Phase 3** — Run analytics, produce insights, final report.

**Trigger:** "Build a data pipeline for [source → destination]" or "Set up analytics for [data]."

---

## WORKFLOW 20 — End-to-End Product Build
**Mode:** 🏗️ Phased (Mega) + 🐳 Container-Orchestrated
**Phase 1 (parallel):** Market Researcher + Competitive Intelligence Analyst + Product Manager
**Phase 2 (parallel):** Software Architect + Database Engineer + API Designer + Frontend Architect + Backend Architect
**Phase 3 (parallel):** Code Analyst (backend) + Code Analyst (frontend) + Docker Engineer
**Phase 4 (parallel):** QA Tester + Security Analyst
**Phase 5 (sequential):** DevOps Engineer (deploy) → SRE (monitor)
**Phase 6:** Lead Synthesizer → Quality Reviewer

**Steps:**
1. **Phase 1** — Market research, competitive analysis, PRD.
2. **Phase 2** — Architecture design (system, DB, API, frontend, backend).
3. **Phase 3** — Build (backend, frontend, Docker).
4. **Phase 4** — Test (QA + security audit).
5. **Phase 5** — Deploy and set up monitoring.
6. **Phase 6** — Final synthesis and quality gate.

**Trigger:** "Build [product] end-to-end" or "From idea to deployment for [product]."

---

## WORKFLOW 21 — Cloud Migration
**Mode:** 🏗️ Phased (Mega) + 🐳 Container-Orchestrated
**Phase 1 (parallel):** Cloud Architect + Software Architect + Database Engineer
**Phase 2 (parallel):** IaC Engineer + DevOps Engineer + Network Engineer
**Phase 3 (sequential):** Docker Engineer → DevOps Engineer (deploy) → SRE
**Phase 4:** Security Analyst → Compliance Analyst → Lead Synthesizer

**Steps:**
1. **Phase 1** — Assess current state, design target architecture, data migration plan.
2. **Phase 2** — Write IaC, set up CI/CD, design network.
3. **Phase 3** — Containerize, deploy, set up monitoring.
4. **Phase 4** — Security audit, compliance check, final migration report.

**Trigger:** "Migrate [system] to [cloud]" or "Move [app] to AWS/GCP/Azure."

---

## WORKFLOW 22 — Continuous Monitoring & Optimization
**Mode:** 🔄🔄 Continuous Loop
**Swarm:** SRE → Data Analyst → DevOps Engineer → (loop)

**Steps:**
1. **SRE** — Collect metrics, identify anomalies, check SLO compliance.
2. **Data Analyst** — Analyze trends, identify optimization opportunities.
3. **DevOps Engineer** — Implement optimizations (scaling, config changes).
4. **Loop** — Periodic check-in (daily/weekly). State persists across cycles.

**Trigger:** "Monitor [system]" or "Set up continuous optimization for [service]."

---

## WORKFLOW 23 — MLOps Pipeline Build
**Mode:** 🐳 Container-Orchestrated + 🔶🔷 Hybrid
**Phase 1 (parallel):** ML Engineer + Data Pipeline Engineer + Data Scientist
**Phase 2 (sequential):** Docker Engineer → DevOps Engineer → SRE
**Phase 3:** Security Analyst → Lead Synthesizer

**Steps:**
1. **Phase 1** — Design training pipeline, data pipeline, model architecture.
2. **Phase 2** — Containerize training and serving, deploy, monitor.
3. **Phase 3** — Security audit (model security, data privacy), final docs.

**Trigger:** "Build an MLOps pipeline for [model]" or "Set up ML training and serving for [use case]."

---

## WORKFLOW 24 — Full-Stack Application from Scratch
**Mode:** 🏗️ Phased (Mega) + 🐳 Container-Orchestrated + 🖥️ Computer-Augmented
**Phase 1 (parallel):** Product Manager + UX Researcher + Market Researcher
**Phase 2 (parallel):** Frontend Architect + Backend Architect + Database Engineer + API Designer
**Phase 3 (parallel):** Code Analyst (frontend) + Code Analyst (backend) + Visual Designer (DALL-E)
**Phase 4 (parallel):** QA Tester + Computer Use Agent (Browser, UI testing) + Security Analyst
**Phase 5 (sequential):** Docker Engineer → DevOps Engineer → SRE
**Phase 6:** Technical Writer → Lead Synthesizer → Quality Reviewer

**Steps:**
1. **Phase 1** — PRD, UX research, market validation.
2. **Phase 2** — Architecture (frontend, backend, DB, API).
3. **Phase 3** — Build (frontend, backend, design mockups).
4. **Phase 4** — Test (QA, UI automation, security).
5. **Phase 5** — Dockerize, deploy, monitor.
6. **Phase 6** — Documentation, final synthesis, quality gate.

**Trigger:** "Build a full-stack app for [idea]" or "Create [product] from scratch, end-to-end."

---

## WORKFLOW 25 — Incident Response & Post-Mortem
**Mode:** 🔷 Parallel Burst (fast) + 🔄 Post-incident
**Phase 1 (parallel, fast):** SRE + Web Researcher + Security Analyst
**Phase 2 (sequential):** DevOps Engineer (fix) → SRE (verify)
**Phase 3:** Lead Synthesizer (blameless post-mortem)

**Steps:**
1. **Phase 1** — Assess impact (SRE), research known issues (Web Researcher), check for attack (Security).
2. **Phase 2** — Implement fix, verify recovery.
3. **Phase 3** — Blameless post-mortem: timeline, root cause, contributing factors, action items.

**Trigger:** "Incident on [system]" or "Post-mortem for [incident]."

---

## WORKFLOW 26 — Multi-Modal Content Campaign
**Mode:** 🔀 Multi-Modal + 🔶🔷 Hybrid
**Phase 1 (parallel):** Content Strategist + Creative Writer + SEO Specialist
**Phase 2 (parallel):** Visual Designer (DALL-E) + Video Producer + Social Media Strategist
**Phase 3 (sequential):** Copy Editor → Quality Reviewer → Lead Synthesizer

**Steps:**
1. **Phase 1** — Strategy, copy, SEO.
2. **Phase 2** — Visuals (images, video scripts, social plan).
3. **Phase 3** — Polish, quality check, unified campaign package.

**Trigger:** "Create a multi-modal campaign for [product/brand]."

---

## COMBINING WORKFLOWS
For mega/giga-missions, chain workflows:
- **Research → Launch:** WF-1 → WF-4
- **Architecture → Build → Deploy:** WF-6 → WF-3 → WF-15
- **Due Diligence → GTM:** WF-7 → WF-8
- **Full Product:** WF-20 (includes everything)
- **Cloud Migration + K8s:** WF-21 → WF-16
- **Security → Compliance:** WF-18 → WF-7 (DD)
- **ML → Deploy:** WF-23 → WF-15
- **Monitor → Incident → Post-Mortem:** WF-22 → WF-25

The orchestrator selects the chain and inserts checkpoint reviews between phases. State persists across chained workflows via the Memory Manager.