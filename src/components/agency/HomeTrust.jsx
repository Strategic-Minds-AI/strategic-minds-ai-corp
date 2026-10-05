import { ShieldCheck, LockKeyhole, FileCheck2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const practices = [
  { icon: LockKeyhole, title: "Security-first architecture", text: "Access, data and system boundaries considered from the start." },
  { icon: ShieldCheck, title: "Responsible AI", text: "Human oversight, explicit controls and practical safeguards where they matter." },
  { icon: FileCheck2, title: "Evidence-driven delivery", text: "Clear validation, documented outcomes and visible implementation decisions." },
  { icon: RefreshCw, title: "Continuous optimization", text: "Measure the system, repair friction and improve what proves valuable." },
];

export default function HomeTrust() {
  return (
    <section className="sm-section sm-trust-section">
      <div className="agency-container">
        <div className="sm-trust-shell">
          <div className="sm-trust-lead">
            <p className="sm-kicker">BUILT FOR REAL OPERATIONS</p>
            <h2>Powerful AI deserves disciplined execution.</h2>
            <p>
              We design systems to be useful, understandable and controllable, with the
              architecture and validation needed to support serious business use.
            </p>
            <Link to="/services#governance" className="sm-secondary-cta">Explore our approach</Link>
          </div>

          <div className="sm-trust-grid">
            {practices.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon size={25} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}