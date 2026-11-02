import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import type { CatalogCard } from "@/components/docs/component-card"
import { ComponentsBrowser } from "@/components/docs/components-browser"
import { PreviewStage } from "@/components/docs/preview-stage"
import { CATALOG, CATEGORIES } from "@/lib/catalog"
import { createPageMetadata } from "@/lib/page-metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Components",
  description:
    "Every drift-ui component running live: tags input, tree view, stepper, filter builder, color picker, tour and more. Open any one for its source and install command.",
  path: "/components",
})

const CARDS: CatalogCard[] = CATALOG.map((entry) => ({
  slug: entry.slug,
  name: entry.name,
  description: entry.description,
  category: entry.category,
  thumbnail: <PreviewStage entry={entry} />,
}))

export default function ComponentsPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-10 pb-24 md:px-10">
      <header className="flex flex-col gap-3">
        <h1 className="rise text-4xl leading-[1.02] font-medium tracking-tight md:text-5xl">
          Components
        </h1>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8">
          <p className="max-w-[78ch] rise text-muted-foreground [--rise-delay:80ms]">
            {CATALOG.length} components you install with the shadcn CLI and own
            as source. Every preview here is the real component.
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
      <ComponentsBrowser categories={CATEGORIES} cards={CARDS} />
    </main>
  )
}
