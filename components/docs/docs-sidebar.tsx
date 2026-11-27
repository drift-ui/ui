"use client"

import { useEffect, useRef } from "react"

import {
  ComponentNavList,
  useActiveComponent,
  type NavGroup,
} from "@/components/docs/component-nav-list"

const EDGE_FADE_PX = 64

export function DocsSidebar({ groups }: { groups: NavGroup[] }) {
  const { library, activeSlug } = useActiveComponent()
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !active) return

    const visibleTop = nav.scrollTop + EDGE_FADE_PX
    const visibleBottom = nav.scrollTop + nav.clientHeight - EDGE_FADE_PX
    const activeBottom = active.offsetTop + active.offsetHeight
    if (active.offsetTop >= visibleTop && activeBottom <= visibleBottom) return

    nav.scrollTo({
      top: active.offsetTop - nav.clientHeight / 2,
      behavior: "smooth",
    })
  }, [activeSlug])

  return (
    <nav
      ref={navRef}
      aria-label="Components"
      className="sticky top-16 -ml-3 max-h-[calc(100dvh-4rem)] [scrollbar-width:none] overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-3rem),transparent)] py-12 pr-2 [&::-webkit-scrollbar]:hidden"
    >
      <ComponentNavList
        groups={groups}
        activeSlug={activeSlug}
        library={library}
        pillId="sidebar-active"
      />
    </nav>
  )
}
