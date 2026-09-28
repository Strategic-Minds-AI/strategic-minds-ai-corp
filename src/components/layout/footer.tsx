import { Link } from "react-router-dom"
import SiteLogo from "./site-logo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

import { footerNav } from "@/config/site";

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="pb-16 pt-28">
          <div className="gap-10 space-y-10 md:grid md:grid-cols-12 md:space-y-0">
            <div className="col-span-3">
              <Link to="/" className="shrink-0">
                <SiteLogo
                  width={123}
                  height={39}
                  lightClasses="dark:hidden"
                  darkClasses="hidden dark:block"
                />
              </Link>
              <p className="mb-8 mt-6">
                Tools to Effectively Build Your Brand and Grow Your Business.
              </p>

            </div>

            {footerNav &&
              footerNav.map((item, index) => (
                <div
                  key={item.title}
                  className={`${
                    index === 0 ? "xl:col-start-7" : ""
                  } col-span-3 xl:col-span-2`}
                >
                  <h2 className="mb-4 text-sm">{item.title}</h2>
                  <NavigationMenu orientation="vertical">
                    <NavigationMenuList className="flex-col items-start space-y-2">
                      {item.items.map((link) => (
                        <NavigationMenuItem
                          key={link.title}
                          className="text-sm"
                        >
                          <Link
                            to={link.href}
                            target={link?.external ? "_blank" : undefined}
                            rel={link?.external ? "noreferrer" : undefined}
                            className="block hover:text-primary"
                          >
                            {link.title}
                          </Link>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>
              ))}
            <div className="col-span-3 xl:col-span-2">
              <h2 className="mb-4 text-sm">Company</h2>
              <p className="mb-5 text-sm leading-relaxed">Start a conversation about your next stage of growth.</p>
              <Link to="/contact" className="text-sm font-medium text-primary">Contact our team →</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t py-12">
        <div className="container text-center">
          <span className="text-xs">
            © {new Date().getFullYear()} Strategic Minds AI. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;