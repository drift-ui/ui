import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { BlockViewer } from "@/components/blocks/block-viewer"
import { BlocksTabs } from "@/components/landing/blocks-tabs"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { BLOCK_GROUPS, BLOCKS } from "@/lib/blocks"
import { createPageMetadata } from "@/lib/page-metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Blocks",
  description:
    "Whole screens composed from drift-ui components: onboarding, profile and security settings, service status, trace inspection, code review, roles and an audit log.",
  path: "/blocks",
})

function padNumber(value: number) {
  return String(value).padStart(2, "0")
}

export default function BlocksPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pt-10 pb-24 md:px-10">
        <header className="flex flex-col gap-3">
          <h1 className="rise font-display text-5xl leading-[0.92] font-semibold tracking-[-0.045em] md:text-7xl">
            Blocks
          </h1>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8">
            <p className="max-w-[78ch] rise text-muted-foreground [--rise-delay:80ms]">
              {BLOCKS.length} screens for after login and signup. Each one lists
              the components it is built from, so you can install those and
              compose the same layout.
            </p>
            <Link
              href="/#install"
              className="group flex w-fit shrink-0 rise items-center gap-1.5 text-sm text-muted-foreground transition-colors [--rise-delay:160ms] hover:text-foreground"
            >
              First time? See how to install
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </header>

        <BlocksTabs
          tabs={BLOCK_GROUPS.map((group, groupIndex) => {
            const groupBlocks = BLOCKS.filter(
              (block) => block.group === group.id
            )

            return {
              id: group.id,
              label: group.label,
              count: groupBlocks.length,
              content: (
                <section
                  key={group.id}
                  aria-labelledby={`group-${group.id}`}
                  className="flex flex-col gap-10"
                >
                  <header className="flex flex-col gap-1.5 border-b pb-4">
                    <div className="flex items-baseline gap-3">
                      <span
                        aria-hidden
                        className="font-mono text-xs text-brand tabular-nums"
                      >
                        {padNumber(groupIndex + 1)}
                      </span>
                      <h2
                        id={`group-${group.id}`}
                        className="font-display text-3xl font-semibold tracking-[-0.04em]"
                      >
                        {group.label}
                      </h2>
                      <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                        {groupBlocks.length}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  </header>

                  <div className="flex flex-col gap-20">
                    {groupBlocks.map((block) => (
                      <BlockViewer key={block.kind} block={block} />
                    ))}
                  </div>
                </section>
              ),
            }
          })}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
