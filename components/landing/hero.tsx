import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { CopyCommand } from "@/components/landing/copy-command"
import { DriftStage } from "@/components/landing/drift-desk"
import { DriftWord } from "@/components/landing/drift-word"
import { SlotPattern } from "@/components/landing/slot-pattern"
import { CATALOG } from "@/lib/catalog"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <SlotPattern className="absolute inset-0 -z-10 hidden size-full [mask-image:radial-gradient(ellipse_44%_52%_at_50%_48%,transparent_45%,black_100%)] text-foreground/[0.05] lg:block" />
      <div className="absolute top-1/2 left-1/2 -z-10 aspect-square w-[56rem] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-solid)_13%,transparent),transparent)]" />
      <DriftStage className="mx-auto max-w-[96rem] px-4 pt-14 pb-20 md:px-10 lg:flex lg:min-h-[max(40rem,calc(100dvh-4rem))] lg:items-center lg:justify-center lg:py-16">
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="rise font-display text-[clamp(3rem,6.6vw,7.25rem)] leading-[0.9] font-semibold tracking-[-0.05em]">
            <span className="block whitespace-nowrap">The components</span>
            <span className="block whitespace-nowrap">
              shadcn left <DriftWord>out</DriftWord>
            </span>
          </h1>
          <p className="mt-8 max-w-[38ch] rise text-lg leading-relaxed text-muted-foreground [--rise-delay:120ms] md:text-xl">
            {CATALOG.length} components you install with the shadcn CLI. Built
            on Radix or Base UI, styled by the tokens you already have.
          </p>
          <div className="mt-10 flex rise flex-col items-center gap-3 [--rise-delay:200ms] sm:flex-row">
            <Button asChild size="lg" className="h-11 px-5 active:scale-[0.98]">
              <Link href="/components" prefetch={false}>
                Browse components <ArrowRightIcon />
              </Link>
            </Button>
            <CopyCommand
              command="npx shadcn add @drift-ui/tags-input"
              className="min-h-11"
            />
          </div>
        </div>
      </DriftStage>
    </section>
  )
}
