import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import SiteLogo from "./site-logo";
import MainNav from "./main-nav"
import { DarkModeSwitch } from "../dark-mode-switch"
import { mainNav } from "../../config/site"
import { cn } from "../../lib/utils"
import { MobileNav } from "./mobile-nav"
import { Phone } from "lucide-react"

const Header = () => {
  const [stickyClass, setStickyClass] = useState("")

  useEffect(() => {
    window.addEventListener("scroll", stickyHeader)

    return () => {
      window.removeEventListener("scroll", stickyHeader)
    }
  }, [])

  const stickyHeader = () => {
    if (window !== undefined) {
      let windowHeight = window.scrollY
      windowHeight > 10 ? setStickyClass("lg:py-3 py-3 shadow-sm") : setStickyClass("")
    }
  }

  return (
    <>
      <header className="fixed top-0 z-20 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur-sm">
        <div className={cn("mx-auto flex w-full items-center px-6 py-4 transition-all lg:py-5 md:px-10 xl:px-16", stickyClass)}>
          <Link to="/" aria-label="Strategic Minds AI home" className="mr-2 shrink-0 sm:mr-5">
            <SiteLogo
              width={123}
              height={39}
              lightClasses="w-4/5 dark:hidden lg:w-auto"
              darkClasses="hidden w-4/5 dark:block lg:w-auto"
            />
          </Link>

          <div className="relative flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 lg:bg-transparent">
            <MainNav items={mainNav} />
            <a href="tel:+17722090266" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 sm:px-4" aria-label="Book a strategy call at +1 772-209-0266"><Phone size={16} aria-hidden="true" /><span className="hidden sm:inline">Book a strategy call</span></a>
            <Link to="/admin" className="inline-flex min-h-11 shrink-0 items-center rounded border border-primary px-2 text-xs font-semibold text-primary hover:bg-muted sm:px-3">Admin</Link>
            <DarkModeSwitch />
            <MobileNav mainNavItems={mainNav} />


          </div>
        </div>
      </header>
    </>
  )
}

export default Header