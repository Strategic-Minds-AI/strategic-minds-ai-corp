import { ArrowRight, Bot, BrainCircuit, Database, Globe2, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

const capabilities = [
  { icon: Bot, label: "AI Agents" },
  { icon: Workflow, label: "Automation" },
  { icon: Database, label: "Data Intelligence" },
  { icon: Globe2, label: "SEO · AEO · GEO" },
];

export default function SectionHero() {
  return (
    <section className="sm-hero relative isolate overflow-hidden">
      <div className="sm-grid-overlay" aria-hidden="true" />
      <div className="sm-orb sm-orb-one" aria-hidden="true" />
      <div className="sm-orb sm-orb-two" aria-hidden="true" />

      <div className="agency-container relative z-10 grid min-h-[760px] items-center gap-12 py-24 lg:grid-cols-[0.92fr_1.08fr] lg:py-28">
        <div className="max-w-3xl">
          <div className="sm-kicker">
            <span className="sm-kicker-dot" />
            STRATEGY · INTELLIGENCE · AUTOMATION · GROWTH
          </div>

          <h1 className="sm-hero-title">
            Smarter systems.
            <span>Stronger business.</span>
          </h1>

          <p className="sm-hero-copy">
            Strategic Minds AI designs and implements practical artificial intelligence systems
            that connect strategy, software, automation, data and digital growth into one
            intelligent operating layer.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="sm-primary-cta">
              Start a conversation <ArrowRight size={17} />
            </Link>
            <Link to="/services" className="sm-secondary-cta">
              Explore our capabilities
            </Link>
          </div>

          <div className="sm-capability-strip">
            {capabilities.map(({ icon: Icon, label }) => (
              <div key={label}>
                <Icon size={18} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sm-command-visual" aria-label="Strategic Minds AI system architecture visualization">
          <div className="sm-command-ring sm-command-ring-a" />
          <div className="sm-command-ring sm-command-ring-b" />
          <div className="sm-command-core">
            <div className="sm-core-mark">
              <BrainCircuit size={56} strokeWidth={1.25} />
            </div>
            <strong>STRATEGIC MINDS AI</strong>
            <span>INTELLIGENCE IN MOTION</span>
          </div>

          <div className="sm-node sm-node-one">
            <Bot size={22} />
            <span>AI AGENTS</span>
          </div>
          <div className="sm-node sm-node-two">
            <Workflow size={22} />
            <span>AUTOMATION</span>
          </div>
          <div className="sm-node sm-node-three">
            <Database size={22} />
            <span>DATA</span>
          </div>
          <div className="sm-node sm-node-four">
            <Globe2 size={22} />
            <span>VISIBILITY</span>
          </div>
        </div>
      </div>
    </section>
  );
}