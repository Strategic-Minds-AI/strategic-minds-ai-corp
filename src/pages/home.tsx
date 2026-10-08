import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import "./strategic-neon-home.css";

const markup = `

  <div class="ambient ambient-a" aria-hidden="true"></div>
  <div class="ambient ambient-b" aria-hidden="true"></div>
  <div class="grid-overlay" aria-hidden="true"></div>

  <header class="site-header">
    <div class="shell nav-shell">
      <a class="brand" href="#top" aria-label="Strategic Minds AI home">
        <span class="brand-mark">S</span>
        <span class="brand-copy">
          <strong>STRATEGIC <em>MINDS</em> AI</strong>
          <small>INTELLIGENCE IN MOTION</small>
        </span>
      </a>

      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">MENU</button>
      <nav class="site-nav" id="site-nav" aria-label="Primary navigation">
        <a href="#services">Capabilities</a>
        <a href="#systems">Systems</a>
        <a href="#process">Process</a>
        <a href="#contact">Contact</a>
      </nav>
      <a class="nav-cta" href="#contact">Build Smarter</a>
    </div>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-art" role="img" aria-label="Strategic Minds AI global intelligence network artwork"></div>
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-scan" aria-hidden="true"></div>

      <div class="shell hero-content">
        <div class="hero-copy">
          <span class="eyebrow">AI STRATEGY • CUSTOM SYSTEMS • AUTOMATION • GROWTH</span>
          <h1 id="hero-title">BUILD SMARTER.<br><span>GROW FASTER.</span></h1>
          <p>
            We architect AI-powered operating systems that turn repetitive work, fragmented tools,
            and growth bottlenecks into connected, measurable infrastructure.
          </p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#contact">Start a Build <span>↗</span></a>
            <a class="btn btn-ghost" href="#systems">Explore Systems</a>
          </div>
          <div class="hero-trust" aria-label="Core services">
            <div><b>01</b><span>AI Strategy</span></div>
            <div><b>02</b><span>Automation</span></div>
            <div><b>03</b><span>Growth Systems</span></div>
            <div><b>04</b><span>Real-World Execution</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="signal-bar" aria-label="Strategic Minds AI specialties">
      <div class="signal-track">
        <span>AI OPERATING SYSTEMS</span><i></i>
        <span>AUTONOMOUS WORKFLOWS</span><i></i>
        <span>WEBSITE FACTORIES</span><i></i>
        <span>CRM + LEAD AUTOMATION</span><i></i>
        <span>SEO / AEO / GEO</span><i></i>
        <span>DATA INTELLIGENCE</span><i></i>
      </div>
    </section>

    <section class="section" id="services">
      <div class="shell">
        <div class="section-heading">
          <span class="eyebrow">CAPABILITIES</span>
          <h2>Strategy is only valuable when it becomes a system.</h2>
          <p>We connect planning, software, automation, intelligence, and measurable growth into one operating layer.</p>
        </div>

        <div class="capability-grid">
          <article class="glass-card feature-card">
            <span class="icon-ring">✦</span>
            <p class="card-kicker">AI STRATEGY</p>
            <h3>Intelligence architecture</h3>
            <p>Opportunity mapping, AI roadmaps, model strategy, data flows, governance, and operating design aligned to business outcomes.</p>
            <a href="#contact">Architect the system →</a>
          </article>

          <article class="glass-card feature-card">
            <span class="icon-ring">⚙</span>
            <p class="card-kicker">AUTOMATION</p>
            <h3>Autonomous execution</h3>
            <p>Agents, workflows, queues, validations, CRM actions, reporting, and repair loops designed to keep work moving with less friction.</p>
            <a href="#contact">Automate the work →</a>
          </article>

          <article class="glass-card feature-card">
            <span class="icon-ring">↗</span>
            <p class="card-kicker">GROWTH</p>
            <h3>Digital demand systems</h3>
            <p>Conversion-first websites, lead capture, programmatic content, SEO/AEO/GEO architecture, attribution, and continuous optimization.</p>
            <a href="#contact">Build the engine →</a>
          </article>

          <article class="glass-card feature-card">
            <span class="icon-ring">◎</span>
            <p class="card-kicker">CUSTOM SYSTEMS</p>
            <h3>Software built around the business</h3>
            <p>Purpose-built internal tools, client portals, admin systems, AI interfaces, dashboards, and integrations where generic software stops fitting.</p>
            <a href="#contact">Design the platform →</a>
          </article>
        </div>
      </div>
    </section>

    <section class="section systems-section" id="systems">
      <div class="shell systems-grid">
        <div class="systems-copy">
          <span class="eyebrow">AI OPERATING SYSTEMS</span>
          <h2>One command layer.<br>Every critical workflow connected.</h2>
          <p>
            Replace disconnected software islands with a governed operating system that can intake work,
            route it, execute it, validate it, record receipts, and keep improving.
          </p>
          <ul class="check-list">
            <li>Single source of truth</li>
            <li>Human approval at protected gates</li>
            <li>Automated lead capture + routing</li>
            <li>Persistent monitoring + validation</li>
            <li>Audit-ready execution receipts</li>
          </ul>
          <a class="btn btn-primary" href="#contact">Design My System <span>↗</span></a>
        </div>

        <div class="command-panel glass-card" aria-label="Example AI operating system flow">
          <div class="panel-top">
            <span class="panel-dot"></span>
            <span>STRATEGIC MINDS / COMMAND NODE</span>
            <small>LIVE</small>
          </div>
          <div class="flow-line"><span>01</span><div><b>INGEST</b><small>Leads • Requests • Data • Signals</small></div><strong>ACTIVE</strong></div>
          <div class="flow-line"><span>02</span><div><b>ORCHESTRATE</b><small>Agents • Rules • Queues • Approvals</small></div><strong>ROUTED</strong></div>
          <div class="flow-line"><span>03</span><div><b>EXECUTE</b><small>Build • Send • Sync • Update</small></div><strong>RUNNING</strong></div>
          <div class="flow-line"><span>04</span><div><b>VALIDATE</b><small>Quality • Policy • Data • Revenue</small></div><strong>PASS</strong></div>
          <div class="flow-line"><span>05</span><div><b>LEARN</b><small>Attribution • Outcomes • Improvements</small></div><strong>LOOP</strong></div>
        </div>
      </div>
    </section>

    <section class="section" id="process">
      <div class="shell">
        <div class="section-heading compact">
          <span class="eyebrow">HOW WE BUILD</span>
          <h2>From idea to operating system.</h2>
        </div>
        <div class="process-grid">
          <article><span>01</span><h3>Discover</h3><p>Map the business, bottlenecks, economics, users, risks, and highest-value automation targets.</p></article>
          <article><span>02</span><h3>Architect</h3><p>Define the visual system, data model, workflows, agents, approval gates, and measurable success criteria.</p></article>
          <article><span>03</span><h3>Build</h3><p>Create the product, website, automation, or platform in an isolated preview environment.</p></article>
          <article><span>04</span><h3>Validate</h3><p>Test UX, browser behavior, data paths, permissions, performance, policy, and conversion flows.</p></article>
          <article><span>05</span><h3>Launch</h3><p>Release only after approval, then monitor outcomes and continuously improve what is working.</p></article>
        </div>
      </div>
    </section>

    <section class="section vision-section">
      <div class="shell vision-grid">
        <div class="vision-orb" aria-hidden="true"><span>S</span></div>
        <div>
          <span class="eyebrow">INTELLIGENCE IN MOTION</span>
          <h2>AI should not sit in a chat window. It should move the business.</h2>
          <p>
            Strategic Minds AI is built around execution: systems that connect information to action,
            action to validation, and validation to measurable business results.
          </p>
        </div>
      </div>
    </section>

    <section class="section contact-section" id="contact">
      <div class="shell contact-grid glass-card">
        <div>
          <span class="eyebrow">READY TO BUILD?</span>
          <h2>Turn the next bottleneck into a competitive advantage.</h2>
          <p>Tell us what you want to automate, build, grow, or replace. We’ll map the shortest path to a working system.</p>
        </div>
        <div class="contact-actions">
          <a class="btn btn-primary" href="/contact">Start a Conversation <span>↗</span></a>
          <a class="btn btn-ghost" href="#top">Back to Top</a>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="shell footer-grid">
      <div class="brand footer-brand">
        <span class="brand-mark">S</span>
        <span class="brand-copy"><strong>STRATEGIC <em>MINDS</em> AI</strong><small>INTELLIGENCE IN MOTION</small></span>
      </div>
      <p>AI Strategy • Custom Systems • Automation • Growth</p>
      <p>© <span id="year"></span> Strategic Minds AI</p>
    </div>
  </footer>
`;

export default function Home() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const toggle = root.querySelector('.menu-toggle');
    const nav = root.querySelector('.site-nav');
    const year = root.querySelector('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    const onToggle = () => {
      if (!toggle || !nav) return;
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    };
    const onNavClick = () => {
      if (!toggle || !nav) return;
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle?.addEventListener('click', onToggle);
    nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', onNavClick));

    return () => {
      toggle?.removeEventListener('click', onToggle);
      nav?.querySelectorAll('a').forEach((link) => link.removeEventListener('click', onNavClick));
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Strategic Minds AI — Intelligence in Motion</title>
        <meta name="description" content="Strategic Minds AI builds AI strategy, custom systems, automation, autonomous workflows, and growth infrastructure." />
        <meta name="theme-color" content="#020711" />
      </Helmet>
      <div ref={rootRef} className="sm-neon-page" dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
