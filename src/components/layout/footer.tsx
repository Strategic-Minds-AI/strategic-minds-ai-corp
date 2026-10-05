import { Link } from "react-router-dom"
import SiteLogo from "./site-logo";
import { footerNav } from "@/config/site";

const Footer = () => <footer className="border-t border-border bg-muted/50">
  <div className="agency-container grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
    <div><Link to="/" aria-label="Strategic Minds AI home"><SiteLogo width={123} height={39} /></Link><p className="mt-5 max-w-xs text-sm leading-relaxed">Strategy, intelligence, automation and growth — designed for measurable business impact.</p></div>
    {footerNav.map(group => <div key={group.title}><h2 className="mb-4 text-sm font-semibold text-foreground">{group.title}</h2><ul className="space-y-2">{group.items?.map(item => <li key={item.title}><Link to={item.href || '/'} className="text-sm hover:text-primary">{item.title}</Link></li>)}</ul></div>)}
  </div>
  <div className="border-t border-border"><div className="agency-container flex flex-wrap justify-between gap-2 py-6 text-xs"><span>© {new Date().getFullYear()} Strategic Minds AI. All rights reserved.</span><Link to="/contact" className="text-primary">Let’s talk →</Link></div></div>
</footer>;
export default Footer;