"use client"

import * as React from "react"
import { MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react"

import { BLOCK_DEMO_WIDTHS, BlockDemo } from "@/components/blocks/block-demo"
import { SegmentedControl } from "@/components/docs/segmented-control"
import { BlockUses } from "@/components/landing/block-uses"
import { CopyCommand } from "@/components/landing/copy-command"
import type { Block } from "@/lib/blocks"

const VIEWPORTS = [
  { value: "desktop", label: "Desktop", width: "100%", Icon: MonitorIcon },
  { value: "tablet", label: "Tablet", width: "768px", Icon: TabletIcon },
  { value: "mobile", label: "Mobile", width: "390px", Icon: SmartphoneIcon },
] as const

type Viewport = (typeof VIEWPORTS)[number]["value"]

const VIEWPORT_ITEMS = VIEWPORTS.map(({ value, label, Icon }) => ({
  value,
  label: (
    <>
      <Icon className="size-4" />
      <span className="sr-only">{label}</span>
    </>
  ),
}))

export function BlockViewer({ block }: { block: Block }) {
  const [viewport, setViewport] = React.useState<Viewport>("desktop")
  const viewportWidth = VIEWPORTS.find(({ value }) => value === viewport)?.width
  const width = `min(${viewportWidth}, ${BLOCK_DEMO_WIDTHS[block.kind] ?? "100%"})`

  return (
    <article
      id={block.kind}
      aria-labelledby={`${block.kind}-title`}
      className="flex scroll-mt-36 flex-col gap-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h3
            id={`${block.kind}-title`}
            className="font-display text-2xl font-semibold tracking-[-0.035em]"
          >
            <a href={`#${block.kind}`} className="hover:text-brand">
              {block.name}
            </a>
          </h3>
          <p className="max-w-[60ch] text-sm text-muted-foreground">
            {block.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            items={VIEWPORT_ITEMS}
            value={viewport}
            onValueChange={setViewport}
            label={`Preview width for ${block.name}`}
            className="max-lg:hidden"
          />
          <CopyCommand
            command={`npx shadcn@latest add ${block.uses.map((slug) => `@drift-ui/${slug}`).join(" ")}`}
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-[1.75rem] border bg-[radial-gradient(80%_70%_at_50%_0%,color-mix(in_oklab,var(--foreground)_5%,transparent),transparent)] p-2 md:p-6">
        <div
          data-theme-scope
          style={{ maxWidth: width }}
          className="@container mx-auto w-full rounded-xl border bg-background shadow-[0_24px_48px_-32px] shadow-black/20 transition-[max-width] duration-300 ease-out motion-reduce:transition-none dark:shadow-black"
        >
          <BlockDemo kind={block.kind} />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          Built from
        </span>
        <BlockUses uses={block.uses} />
      </div>
    </article>
  )
}
