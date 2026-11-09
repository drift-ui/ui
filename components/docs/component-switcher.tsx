"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  ComponentNavList,
  useActiveComponent,
  type NavGroup,
} from "@/components/docs/component-nav-list"
import { componentPath, type PrimitiveLibrary } from "@/lib/primitive-library"

type Neighbor = { slug: string; name: string }

function StepLink({
  neighbor,
  direction,
  library,
}: {
  neighbor?: Neighbor
  direction: "previous" | "next"
  library: PrimitiveLibrary
}) {
  const Icon = direction === "next" ? ArrowRightIcon : ArrowLeftIcon
  const className =
    "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"

  if (!neighbor) {
    return (
      <span aria-hidden className={cn(className, "opacity-30")}>
        <Icon className="size-4" />
      </span>
    )
  }

  return (
    <Link
      href={componentPath(neighbor.slug, library)}
      rel={direction === "next" ? "next" : "prev"}
      aria-label={`${direction === "next" ? "Next" : "Previous"}: ${neighbor.name}`}
      title={neighbor.name}
      className={className}
    >
      <Icon className="size-4" />
    </Link>
  )
}

export function ComponentSwitcher({
  groups,
  position,
  total,
  categoryLabel,
  previous,
  next,
  library,
}: {
  groups: NavGroup[]
  position: number
  total: number
  categoryLabel?: string
  previous?: Neighbor
  next?: Neighbor
  library: PrimitiveLibrary
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { activeSlug } = useActiveComponent()

  useEffect(() => {
    if (!isOpen) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
  }, [isOpen])

  return (
    <div
      ref={rootRef}
      onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}
      className="relative flex items-center gap-1"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="docs-component-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="-ml-2 flex h-8 items-center gap-2 rounded-md px-2 font-mono text-xs text-muted-foreground tabular-nums outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span>Components</span>
        <span aria-hidden>/</span>
        <span>{categoryLabel}</span>
        <span aria-hidden>·</span>
        <span>
          <span className="text-brand">
            {String(position).padStart(2, "0")}
          </span>{" "}
          / {total}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-3.5 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <StepLink neighbor={previous} direction="previous" library={library} />
      <StepLink neighbor={next} direction="next" library={library} />
      <nav
        id="docs-component-menu"
        aria-label="Components"
        hidden={!isOpen}
        className="absolute top-full left-0 z-40 mt-2 max-h-[min(70dvh,40rem)] w-[min(64rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border bg-background p-6 shadow-[0_24px_48px_-32px] shadow-foreground/20"
      >
        <ComponentNavList
          groups={groups}
          activeSlug={activeSlug}
          library={library}
          pillId="docs-menu-active"
          onNavigate={() => setIsOpen(false)}
          className="sm:grid sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 sm:[&>a:first-child]:col-span-full"
        />
      </nav>
    </div>
  )
}
