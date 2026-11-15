import Link from "next/link"
import { ArrowUpRightIcon, ChevronRightIcon } from "lucide-react"

import { LibraryTabs } from "@/components/docs/library-tabs"
import { findCategory, type CatalogEntry } from "@/lib/catalog"
import {
  registryItemPath,
  type PrimitiveLibrary,
} from "@/lib/primitive-library"
import { siteConfig } from "@/lib/site-config"

export function ComponentHeader({
  entry,
  library,
}: {
  entry: CatalogEntry
  library: PrimitiveLibrary
}) {
  const category = findCategory(entry.category)
  const registryPath = registryItemPath(entry.slug, library)
  const v0Url = `https://v0.app/chat/api/open?url=${encodeURIComponent(`${siteConfig.url}${registryPath}`)}`

  return (
    <header className="flex flex-col gap-5">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
      >
        <Link
          href="/components"
          className="transition-colors hover:text-foreground"
        >
          Components
        </Link>
        <ChevronRightIcon className="size-3 opacity-60" />
        <span>{category?.label}</span>
      </nav>
      <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.04em] md:text-5xl">
        {entry.name}
      </h1>
      <p className="max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
        {entry.description}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
        <code className="text-foreground">@drift-ui/{entry.slug}</code>
        {entry.category === "primitives" && <span>Same API as shadcn/ui</span>}
        <a
          href={registryPath}
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          Registry JSON
          <ArrowUpRightIcon className="size-3" />
        </a>
        <a
          href={v0Url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          Open in v0
          <ArrowUpRightIcon className="size-3" />
        </a>
      </div>
      <LibraryTabs slug={entry.slug} library={library} />
    </header>
  )
}
