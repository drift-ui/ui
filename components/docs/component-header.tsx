import { ArrowUpRightIcon } from "lucide-react"

import { FlagshipSticker } from "@/components/docs/flagship-sticker"
import { LibraryTabs } from "@/components/docs/library-tabs"
import type { CatalogEntry } from "@/lib/catalog"
import {
  registryItemPath,
  type PrimitiveLibrary,
} from "@/lib/primitive-library"
import { siteConfig } from "@/lib/site-config"

export function ComponentHeader({
  entry,
  library,
  sourceUrl,
  switcher,
}: {
  entry: CatalogEntry
  library: PrimitiveLibrary
  sourceUrl: string
  switcher: React.ReactNode
}) {
  const registryPath = registryItemPath(entry.slug, library)
  const v0Url = `https://v0.app/chat/api/open?url=${encodeURIComponent(`${siteConfig.url}${registryPath}`)}`
  const links = [
    { label: "Registry JSON", href: registryPath, isExternal: false },
    { label: "GitHub", href: sourceUrl, isExternal: true },
    { label: "Open in v0", href: v0Url, isExternal: true },
  ]

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
      <div className="flex min-w-0 flex-col gap-2">
        {switcher}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl leading-none font-semibold tracking-[-0.04em] md:text-4xl">
            {entry.name}
          </h1>
          {entry.isFlagship && <FlagshipSticker />}
        </div>
        <p className="max-w-[64ch] text-muted-foreground">
          {entry.description}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 lg:items-end">
        <LibraryTabs slug={entry.slug} library={library} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <code className="text-foreground">@drift-ui/{entry.slug}</code>
          {entry.category === "primitives" && <span>shadcn/ui API</span>}
          {links.map(({ label, href, isExternal }) => (
            <a
              key={label}
              href={href}
              {...(isExternal && { target: "_blank", rel: "noreferrer" })}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              {label}
              <ArrowUpRightIcon className="size-3" />
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
