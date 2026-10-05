import { Link } from "react-router-dom";
import {
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  Code2,
  Search,
  Workflow,
} from "lucide-react";

const services = [
  { icon: BrainCircuit, title: "AI Strategy & Consulting", copy: "Turn opportunities into a practical AI roadmap, architecture and execution plan." },
  { icon: Bot, title: "Custom AI Systems", copy: "Build AI agents, knowledge systems and intelligent tools around real business workflows." },
  { icon: Workflow, title: "Workflow Automation", copy: "Connect systems, remove repetitive work and create dependable operating flows." },
  { icon: Code2, title: "Software & Digital Experiences", copy: "Create AI-powered websites, portals, applications and connected business systems." },
  { icon: ChartNoAxesCombined, title: "Data Intelligence", copy: "Transform operational data into clearer signals, faster decisions and measurable action." },
  { icon: Search, title: "SEO · AEO · GEO", copy: "Improve discoverability across search engines, answer engines and generative AI experiences." },
];

export default function ServiceSpotlight() {
  return (
    <section id="expertise" className="sm-section sm-section-deep scroll-mt-28">
      <div className="agency-container">
        <div className="sm-section-heading">
          <p className="sm-kicker">WHAT WE BUILD</p>
          <h2>Custom AI systems built around your business.</h2>
          <p>
            From strategy through implementation, we combine AI, automation, software and growth
            systems into solutions designed for real operating goals.
          </p>
        </div>

        <div className="sm-service-grid">
          {services.map(({ icon: Icon, title, copy }, index) => (
            <article key={title} className="sm-glass-card">
              <div className="sm-card-index">0{index + 1}</div>
              <div className="sm-icon-well"><Icon size={28} strokeWidth={1.5} /></div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link to="/services">Explore capability <span>→</span></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}