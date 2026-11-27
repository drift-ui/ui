"use client"

import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  ComponentNavList,
  useActiveComponent,
  type NavGroup,
} from "@/components/docs/component-nav-list"

export function DocsMobileNav({
  groups,
  className,
}: {
  groups: NavGroup[]
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { library, activeSlug } = useActiveComponent()
  const activeName = groups
    .flatMap((group) => group.entries)
    .find((entry) => entry.slug === activeSlug)?.name

  return (
    <nav
      aria-label="Components"
      onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}
      className={cn(
        "sticky top-16 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="docs-mobile-nav"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-12 w-full items-center justify-between gap-3 px-4 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:px-10"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground">Components</span>
          {activeName && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="truncate font-medium">{activeName}</span>
            </>
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        id="docs-mobile-nav"
        className={cn(
          "max-h-[calc(100dvh-7rem)] overflow-y-auto border-t border-border/60 px-1 py-4 md:px-7",
          !isOpen && "hidden"
        )}
      >
        <ComponentNavList
          groups={groups}
          activeSlug={activeSlug}
          library={library}
          pillId="mobile-active"
          onNavigate={() => setIsOpen(false)}
        />
      </div>
    </nav>
  )
}
