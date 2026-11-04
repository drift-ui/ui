"use client"

import { CardGroup } from "@/components/docs/card-group"
import type { CatalogCard } from "@/components/docs/component-card"
import { EmptyResults } from "@/components/docs/empty-results"
import {
  RequestComponentCallout,
  RequestComponentLink,
} from "@/components/docs/request-component"
import { SearchField } from "@/components/docs/search-field"
import { SegmentedControl } from "@/components/docs/segmented-control"
import type { CATEGORIES } from "@/lib/catalog"
import { useUrlFilters } from "@/lib/use-url-filters"

type Category = (typeof CATEGORIES)[number]

const ALL = "all"

function matchesQuery(card: CatalogCard, query: string) {
  if (!query) return true

  return [card.name, card.slug, card.description]
    .join(" ")
    .toLowerCase()
    .includes(query)
}

type Filters = { query: string; category: string }

function parseFilters(search: string, categories: Category[]): Filters {
  const params = new URLSearchParams(search)
  const category = params.get("category")

  return {
    query: params.get("q") ?? "",
    category: categories.find(({ id }) => id === category)?.id ?? ALL,
  }
}

function filtersToParams({ query, category }: Filters) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (category !== ALL) params.set("category", category)

  return params
}

export function ComponentsBrowser({
  categories,
  cards,
}: {
  categories: Category[]
  cards: CatalogCard[]
}) {
  const [filters, setFilters] = useUrlFilters(
    (search) => parseFilters(search, categories),
    filtersToParams
  )
  const { query, category: activeCategory } = filters

  const normalizedQuery = query.trim().toLowerCase()
  const searched = cards.filter((card) => matchesQuery(card, normalizedQuery))
  const visibleSlugs = new Set(
    searched
      .filter(
        (card) => activeCategory === ALL || card.category === activeCategory
      )
      .map((card) => card.slug)
  )

  const filterItems = [{ id: ALL, label: "All" }, ...categories].map(
    ({ id, label }) => ({
      value: id,
      label: (
        <>
          {label}
          <span className="hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:inline">
            {id === ALL
              ? searched.length
              : searched.filter((card) => card.category === id).length}
          </span>
        </>
      ),
    })
  )

  function resetFilters() {
    setFilters({ query: "", category: ALL })
  }

  return (
    <div className="flex flex-col">
      <div className="contents lg:sticky lg:top-16 lg:z-20 lg:flex lg:items-center lg:gap-3 lg:border-b lg:border-border/60 lg:bg-background/80 lg:py-3 lg:backdrop-blur-md">
        <SearchField
          value={query}
          onValueChange={(next) => setFilters({ ...filters, query: next })}
          className="lg:w-72"
        />
        <div className="sticky top-16 z-20 -mx-4 mt-1 border-b border-border/60 bg-background/80 px-4 py-2 backdrop-blur-md md:-mx-10 md:px-10 lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <SegmentedControl
            items={filterItems}
            value={activeCategory}
            onValueChange={(next) => setFilters({ ...filters, category: next })}
            label="Filter by category"
            className="-mx-1 [scrollbar-width:none] overflow-x-auto px-1 max-sm:justify-between max-sm:[&>button]:px-2"
          />
        </div>
      </div>
      <p role="status" className="sr-only">
        {visibleSlugs.size === 1
          ? "1 component"
          : `${visibleSlugs.size} components`}
      </p>
      {visibleSlugs.size === 0 && (
        <div className="mt-8">
          <EmptyResults
            query={query}
            onReset={resetFilters}
            action={<RequestComponentLink name={query} />}
          />
        </div>
      )}
      <div className="mt-8 flex flex-col gap-12">
        {categories.map((category) => (
          <CardGroup
            key={category.id}
            id={category.id}
            label={category.label}
            description={category.description}
            cards={cards.filter((card) => card.category === category.id)}
            visibleSlugs={visibleSlugs}
          />
        ))}
      </div>
      {visibleSlugs.size > 0 && (
        <div className="mt-16">
          <RequestComponentCallout />
        </div>
      )}
    </div>
  )
}
