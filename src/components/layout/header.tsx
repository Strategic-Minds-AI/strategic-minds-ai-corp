import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import SiteLogo from "./site-logo";
import MainNav from "./main-nav"
import { DarkModeSwitch } from "../dark-mode-switch"
import { mainNav } from "../../config/site"
import { cn } from "../../lib/utils"
import { MobileNav } from "./mobile-nav"

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
        <div className={cn("mx-auto flex max-w-[1440px] items-center px-6 py-4 transition-all lg:py-5 xl:px-10", stickyClass)}>
          <Link to="/" className="mr-12 shrink-0">
            <SiteLogo
              width={123}
              height={39}
              lightClasses="w-4/5 dark:hidden lg:w-auto"
              darkClasses="hidden w-4/5 dark:block lg:w-auto"
            />
          </Link>

          <div className="relative flex w-full items-center justify-end lg:justify-start lg:bg-transparent">
            <MainNav items={mainNav} />
            <DarkModeSwitch />
            <MobileNav mainNavItems={mainNav} />

            <div className="ml-3 hidden md:inline-block lg:ml-auto">
              <Link to="/contact" className="inline-flex items-center rounded bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground">Book a Consultation →</Link>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header