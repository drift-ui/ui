import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { CATALOG, CATEGORIES } from "@/lib/catalog"
import { SectionHeading } from "@/components/landing/section-heading"

const NAMES_PER_CATEGORY = 5

const ROWS = CATEGORIES.map((category) => {
  const entries = CATALOG.filter((entry) => entry.category === category.id)
  const flagshipsFirst = [
    ...entries.filter((entry) => entry.isFlagship),
    ...entries.filter((entry) => !entry.isFlagship),
  ]

  return {
    ...category,
    total: entries.length,
    named: flagshipsFirst.slice(0, NAMES_PER_CATEGORY),
  }
})

export function CatalogBand() {
  return (
    <section
      id="catalog"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 md:px-10 md:py-36"
    >
      <SectionHeading
        title="Browse by category"
        lead={`${CATALOG.length} components across ${CATEGORIES.length} categories. Every one has a live preview, its source and install steps.`}
      />
      <ul className="mt-14 border-t md:mt-20">
        {ROWS.map((row) => (
          <li key={row.id} className="reveal border-b">
            <Link
              href={`/components?category=${row.id}`}
              prefetch={false}
              className="group grid gap-x-8 gap-y-2 py-6 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:grid-cols-[4rem_minmax(0,16rem)_minmax(0,1fr)_auto] md:items-baseline"
            >
              <span className="font-display text-3xl leading-none font-semibold tracking-[-0.04em] text-brand tabular-nums">
                {row.total}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-2xl font-semibold tracking-tight underline-offset-4 transition-colors group-hover:text-brand">
                  {row.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {row.description}
                </span>
              </span>
              <span className="text-foreground/75">
                {row.named.map((entry) => entry.name).join(", ")}
                {row.total > row.named.length &&
                  ` and ${row.total - row.named.length} more`}
              </span>
              <ArrowRightIcon
                aria-hidden
                className="hidden size-4 text-muted-foreground transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-brand md:block"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
