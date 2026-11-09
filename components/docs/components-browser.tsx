"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { EmptyResults } from "@/components/docs/empty-results"
import { FlagshipSticker } from "@/components/docs/flagship-sticker"
import { KeyboardStrip } from "@/components/docs/keyboard-strip"
import {
  RequestComponentCallout,
  RequestComponentLink,
} from "@/components/docs/request-component"
import { SearchField } from "@/components/docs/search-field"
import { SegmentedControl } from "@/components/docs/segmented-control"
import { CopyCommand } from "@/components/landing/copy-command"
import type { CATEGORIES } from "@/lib/catalog"
import { COMPONENT_KEYBOARD } from "@/lib/component-keyboard"
import { useUrlFilters } from "@/lib/use-url-filters"

export type CatalogCard = {
  slug: string
  name: string
  description: string
  category: string
  isFlagship?: boolean
  thumbnail: React.ReactNode
}

type Category = (typeof CATEGORIES)[number]

const ALL = "all"
const HOVER_INTENT_MS = 90
const STAGE_KEY_LIMIT = 4

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

function padNumber(value: number) {
  return String(value).padStart(2, "0")
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
  const [activeSlug, setActiveSlug] = useState<string>()
  const intentTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(intentTimerRef.current), [])

  const normalizedQuery = query.trim().toLowerCase()
  const searched = cards.filter((card) => matchesQuery(card, normalizedQuery))
  const visibleCards = searched.filter(
    (card) => activeCategory === ALL || card.category === activeCategory
  )
  const visibleSlugs = new Set(visibleCards.map((card) => card.slug))
  const shownCard =
    visibleCards.find((card) => card.slug === activeSlug) ?? visibleCards[0]

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

  function previewAfterIntent(slug: string) {
    clearTimeout(intentTimerRef.current)
    intentTimerRef.current = setTimeout(
      () => setActiveSlug(slug),
      HOVER_INTENT_MS
    )
  }

  function previewNow(slug: string) {
    clearTimeout(intentTimerRef.current)
    setActiveSlug(slug)
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
            className="-mx-1 scrollbar-none overflow-x-auto px-1 max-sm:justify-between max-sm:[&>button]:px-2"
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
      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-14 xl:gap-20">
        <div className="flex flex-col gap-14">
          {categories.map((category, categoryIndex) => {
            const categoryCards = cards.filter(
              (card) => card.category === category.id
            )
            const visibleCount = categoryCards.filter(({ slug }) =>
              visibleSlugs.has(slug)
            ).length

            return (
              <section
                key={category.id}
                hidden={visibleCount === 0}
                aria-labelledby={`group-${category.id}`}
                className="flex flex-col gap-4"
              >
                <header className="flex flex-col gap-1.5 border-b pb-4">
                  <div className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className="font-mono text-xs text-brand tabular-nums"
                    >
                      {padNumber(categoryIndex + 1)}
                    </span>
                    <h2
                      id={`group-${category.id}`}
                      className="font-display text-3xl font-semibold tracking-[-0.04em]"
                    >
                      {category.label}
                    </h2>
                    <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                      {visibleCount}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </header>
                <ol className="flex flex-col">
                  {categoryCards.map((card) => {
                    const isShown = card.slug === shownCard?.slug

                    return (
                      <li key={card.slug} hidden={!visibleSlugs.has(card.slug)}>
                        <Link
                          href={`/components/${card.slug}`}
                          data-shown={isShown || undefined}
                          aria-describedby={`${card.slug}-summary`}
                          onPointerEnter={() => previewAfterIntent(card.slug)}
                          onPointerLeave={() =>
                            clearTimeout(intentTimerRef.current)
                          }
                          onFocus={() => previewNow(card.slug)}
                          className="group/row -mx-3 flex flex-col rounded-xl px-3 py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:py-1.5"
                        >
                          <span className="flex items-center gap-4">
                            <span
                              aria-hidden
                              className="w-6 shrink-0 font-mono text-xs text-muted-foreground tabular-nums transition-colors group-data-shown/row:text-brand"
                            >
                              {padNumber(cards.indexOf(card) + 1)}
                            </span>
                            <span className="font-display text-2xl font-semibold tracking-[-0.035em] transition-colors group-hover/row:text-foreground group-data-shown/row:text-foreground lg:text-foreground/45">
                              {card.name}
                            </span>
                            {card.isFlagship && (
                              <FlagshipSticker className="text-[10px]" />
                            )}
                            <ArrowRightIcon className="ml-auto size-4 shrink-0 -translate-x-1 text-brand opacity-0 transition-[opacity,translate] duration-300 group-data-shown/row:translate-x-0 group-data-shown/row:opacity-100 max-lg:hidden" />
                          </span>
                          <span
                            id={`${card.slug}-summary`}
                            aria-hidden
                            className="mt-0.5 pl-10 text-sm text-muted-foreground lg:hidden"
                          >
                            {card.description}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )
          })}
        </div>
        {shownCard && (
          <aside aria-label="Preview" className="hidden lg:block">
            <SpecimenStage
              key={shownCard.slug}
              card={shownCard}
              number={cards.indexOf(shownCard) + 1}
              total={cards.length}
              categoryLabel={
                categories.find(({ id }) => id === shownCard.category)?.label
              }
            />
          </aside>
        )}
      </div>
      {visibleSlugs.size > 0 && (
        <div className="mt-20">
          <RequestComponentCallout />
        </div>
      )}
    </div>
  )
}

function SpecimenStage({
  card,
  number,
  total,
  categoryLabel,
}: {
  card: CatalogCard
  number: number
  total: number
  categoryLabel?: string
}) {
  const keyboard = COMPONENT_KEYBOARD[card.slug]

  return (
    <div className="sticky top-38 flex swap-in flex-col gap-5">
      <p className="flex items-center justify-between font-mono text-xs text-muted-foreground tabular-nums">
        <span>{categoryLabel}</span>
        <span>
          <span className="text-brand">{padNumber(number)}</span> /{" "}
          {padNumber(total)}
        </span>
      </p>
      <div className="@container flex max-h-[calc(100dvh-30rem)] min-h-56 items-center-safe overflow-y-auto rounded-[1.75rem] border bg-[radial-gradient(80%_70%_at_50%_0%,color-mix(in_oklab,var(--foreground)_5%,transparent),transparent)] px-8 py-10">
        <div className="mx-auto w-full max-w-xl">{card.thumbnail}</div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <p className="font-display text-3xl font-semibold tracking-[-0.04em]">
              {card.name}
            </p>
            {card.isFlagship && <FlagshipSticker className="text-xs" />}
          </div>
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </div>
        {keyboard && (
          <KeyboardStrip bindings={keyboard.slice(0, STAGE_KEY_LIMIT)} />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="h-10 px-4">
            <Link href={`/components/${card.slug}`}>
              Open {card.name}
              <ArrowRightIcon />
            </Link>
          </Button>
          <CopyCommand
            command={`npx shadcn@latest add @drift-ui/${card.slug}`}
          />
        </div>
      </div>
    </div>
  )
}
