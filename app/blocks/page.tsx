import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { BlockStage } from "@/components/landing/block-stage"
import { BlockUses } from "@/components/landing/block-uses"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { BLOCKS } from "@/lib/blocks"
import { createPageMetadata } from "@/lib/page-metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Blocks",
  description:
    "Whole screens composed from drift-ui components: onboarding, team invites, security settings, a file manager, a release scheduler and an audit log.",
  path: "/blocks",
})

export default function BlocksPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-4 pt-16 pb-24 md:px-10 md:pt-24">
        <header className="flex flex-col gap-6">
          <span className="rise font-mono text-xs tracking-widest text-brand uppercase">
            Blocks
          </span>
          <h1 className="max-w-3xl rise text-5xl leading-[1.02] font-medium tracking-tight [--rise-delay:80ms] md:text-6xl">
            Whole screens,
            <br />
            <span className="text-muted-foreground">not just parts.</span>
          </h1>
          <p className="max-w-[52ch] rise text-lg leading-relaxed text-muted-foreground [--rise-delay:160ms]">
            {BLOCKS.length} screens that come after login and signup. Each one
            lists the components it is built from, so you can install those and
            compose the same layout.
          </p>
          <Link
            href="/#install"
            className="group flex w-fit rise items-center gap-1.5 text-sm text-muted-foreground transition-colors [--rise-delay:240ms] hover:text-foreground"
          >
            First time? See how to install
            <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </header>

        <div className="grid gap-x-8 gap-y-16 lg:grid-cols-2">
          {BLOCKS.map((block) => (
            <article
              key={block.kind}
              id={block.kind}
              className="flex reveal scroll-mt-24 flex-col gap-5"
            >
              <BlockStage kind={block.kind} />
              <div className="flex flex-col gap-3 px-1">
                <h2 className="text-xl font-medium tracking-tight">
                  {block.name}
                </h2>
                <p className="max-w-[52ch] text-muted-foreground">
                  {block.description}
                </p>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">
                    Built from
                  </span>
                  <BlockUses uses={block.uses} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
