import { SearchCheck, Map, Wrench, ChartNoAxesCombined } from "lucide-react";

const steps = [
  { icon: SearchCheck, title: "Discover", detail: "Understand the business, friction, goals, data and highest-value opportunities." },
  { icon: Map, title: "Architect", detail: "Design the system, workflow, information model and measurable implementation path." },
  { icon: Wrench, title: "Build", detail: "Implement the approved system with controlled integrations and validation gates." },
  { icon: ChartNoAxesCombined, title: "Optimize", detail: "Measure outcomes, refine performance and expand what proves useful." },
];

export default function HomeProcess() {
  return (
    <section className="sm-section sm-process-section">
      <div className="agency-container">
        <div className="sm-section-heading">
          <p className="sm-kicker">HOW WE WORK</p>
          <h2>From possibility to operational intelligence.</h2>
          <p>A disciplined path from business problem to working system, with clarity at every stage.</p>
        </div>

        <div className="sm-process-grid">
          {steps.map((step, index) => (
            <article key={step.title} className="sm-process-card">
              <div className="sm-process-number">0{index + 1}</div>
              <div className="sm-icon-well"><step.icon size={25} strokeWidth={1.5} /></div>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}