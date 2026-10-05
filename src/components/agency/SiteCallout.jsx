import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function SiteCallout() {
  return (
    <section className="sm-section sm-cta-section">
      <div className="agency-container">
        <div className="sm-final-cta">
          <div className="sm-final-glow" aria-hidden="true" />
          <div className="relative z-10 max-w-3xl">
            <p className="sm-kicker">YOUR NEXT MOVE</p>
            <h2>Build a smarter operating system for your business.</h2>
            <p>
              Bring us the goal, bottleneck or opportunity. We’ll help turn it into a practical
              AI strategy and a system designed to move the business forward.
            </p>
          </div>
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link to="/contact" className="sm-primary-cta">
              Start a conversation <ArrowRight size={17} />
            </Link>
            <a href="tel:7722090266" className="sm-secondary-cta">772-209-0266</a>
          </div>
        </div>
      </div>
    </section>
  );
}