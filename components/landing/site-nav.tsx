import Link from "next/link"
import { DownloadIcon, StarIcon, UsersIcon } from "lucide-react"
import { siDiscord, siGithub } from "simple-icons"

import { LogoMark } from "@/components/landing/logo-mark"
import { MobileNav } from "@/components/landing/mobile-nav"
import { NavIconLink } from "@/components/landing/nav-icon-link"
import { ThemeScopeBadge } from "@/components/landing/theme-scope-badge"
import { ThemeToggle } from "@/components/landing/theme-toggle"
import { siteConfig } from "@/lib/site-config"
import { Button } from "@/registry/default/ui/button"

const DESKTOP_LINKS = [
  { href: "/components", label: "Components" },
  { href: "/blocks", label: "Blocks" },
  { href: "/themes", label: "Themes" },
  { href: "/resources", label: "Resources" },
]

const MOBILE_LINKS = [
  ...DESKTOP_LINKS,
  { href: "/#install", label: "Install" },
  { href: "/contributors", label: "Contributors" },
]

export function SiteNav({ search }: { search?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-10">
        <Link
          href="/"
          prefetch={false}
          className="flex shrink-0 items-center gap-2.5 font-display text-lg font-semibold tracking-tight"
        >
          <LogoMark />
          drift-ui
        </Link>
        <div className="flex items-center gap-1 md:gap-6">
          <ul className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            {DESKTOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1">
            {search}
            <ThemeScopeBadge className="mr-1 hidden sm:flex" />
            <NavIconLink
              href={siteConfig.discord}
              label="Join the drift-ui Discord"
              iconPath={siDiscord.path}
            >
              <UsersIcon className="size-3.5 text-brand" />
              Come build with us on Discord
            </NavIconLink>
            <NavIconLink
              href={siteConfig.repo}
              label="Star drift-ui on GitHub"
              iconPath={siGithub.path}
            >
              <StarIcon className="size-3.5 fill-current text-brand" />
              Like drift-ui? Star it on GitHub
            </NavIconLink>
            <ThemeToggle />
            <Button asChild className="ml-2 hidden sm:inline-flex">
              <Link href="/#install" prefetch={false}>
                <DownloadIcon />
                Install
              </Link>
            </Button>
          </div>
          <MobileNav links={MOBILE_LINKS} className="lg:hidden" />
        </div>
      </nav>
    </header>
  )
}
