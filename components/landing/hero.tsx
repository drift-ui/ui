import { DriftWord } from "@/components/landing/drift-word"
import { NeedFinder } from "@/components/landing/need-finder"
import { SlotPattern } from "@/components/landing/slot-pattern"
import { CATALOG } from "@/lib/catalog"

const FINDER_ENTRIES = CATALOG.map(({ slug, name, description }) => ({
  slug,
  name,
  description,
}))

export function Hero() {
  return (
    <section className="relative isolate">
      <SlotPattern className="absolute inset-0 -z-10 size-full [mask-image:linear-gradient(to_bottom,black,transparent_80%)] text-foreground/[0.04]" />
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-20 md:px-10 md:pt-16 md:pb-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <h1 className="rise font-display text-[clamp(3rem,6.7vw,6rem)] leading-[0.9] font-semibold tracking-[-0.04em]">
            <span className="block whitespace-nowrap">The components</span>
            <span className="block whitespace-nowrap">
              shadcn left <DriftWord>out</DriftWord>
            </span>
          </h1>
          <p className="max-w-[36ch] rise text-lg leading-relaxed text-muted-foreground [--rise-delay:120ms] lg:mb-2">
            {CATALOG.length} components you install with the shadcn CLI, built
            on Radix or Base UI and styled by the tokens you already have.
          </p>
        </div>
        <NeedFinder entries={FINDER_ENTRIES} />
      </div>
    </section>
  )
}
