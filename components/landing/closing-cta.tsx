"use client"

import { useLenis } from "lenis/react"
import { SearchIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { componentRequestUrl } from "@/components/docs/request-component"
import { NEED_FINDER_INPUT_ID } from "@/components/landing/need-finder"
import { SlotPattern } from "@/components/landing/slot-pattern"

const SEARCH_SCROLL_OFFSET_PX = -120

export function ClosingCta() {
  const lenis = useLenis()

  function focusSearch() {
    const input = document.getElementById(NEED_FINDER_INPUT_ID)
    if (!input) return

    input.focus({ preventScroll: true })
    if (lenis) {
      lenis.scrollTo(input, { offset: SEARCH_SCROLL_OFFSET_PX })
    } else {
      input.scrollIntoView({ block: "center" })
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 md:px-10 md:pb-36">
      <div className="relative isolate flex reveal flex-col gap-8 overflow-hidden rounded-3xl border bg-card/40 p-8 md:flex-row md:items-end md:justify-between md:p-14">
        <SlotPattern className="absolute inset-0 -z-10 size-full [mask-image:linear-gradient(to_left,black,transparent_70%)] text-foreground/[0.04]" />
        <h2 className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.04em] text-balance">
          Missing a component?
          <br />
          It might be here.
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={focusSearch}
            className="h-11 px-5 active:scale-[0.98]"
          >
            <SearchIcon />
            Search components
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 px-5 active:scale-[0.98]"
          >
            <a href={componentRequestUrl()} target="_blank" rel="noreferrer">
              Request one
              <span className="sr-only"> (opens GitHub in a new tab)</span>
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
