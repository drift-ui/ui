import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import type { CatalogEntry } from "@/lib/catalog"
import { componentPath, type PrimitiveLibrary } from "@/lib/primitive-library"

function PagerLink({
  entry,
  direction,
  library,
}: {
  entry: CatalogEntry
  direction: "previous" | "next"
  library: PrimitiveLibrary
}) {
  const isNext = direction === "next"

  return (
    <Link
      href={componentPath(entry.slug, library)}
      rel={isNext ? "next" : "prev"}
      className={cn(
        "group flex flex-col gap-1.5 rounded-2xl border p-5 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        isNext && "items-end text-right sm:col-start-2"
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {!isNext && (
          <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
        {isNext ? "Next" : "Previous"}
        {isNext && (
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="font-medium">{entry.name}</span>
    </Link>
  )
}

export function Pager({
  previous,
  next,
  library,
}: {
  previous?: CatalogEntry
  next?: CatalogEntry
  library: PrimitiveLibrary
}) {
  return (
    <nav
      aria-label="Previous and next component"
      className="grid gap-3 border-t pt-10 sm:grid-cols-2"
    >
      {previous && (
        <PagerLink entry={previous} direction="previous" library={library} />
      )}
      {next && <PagerLink entry={next} direction="next" library={library} />}
    </nav>
  )
}
