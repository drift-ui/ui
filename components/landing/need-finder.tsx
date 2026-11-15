"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, SearchIcon } from "lucide-react"

import { componentRequestUrl } from "@/components/docs/request-component"
import { CopyCommand } from "@/components/landing/copy-command"
import { useSlashFocus } from "@/hooks/use-slash-focus"
import { matchScore, searchWords } from "@/lib/component-search"

export type FinderEntry = {
  slug: string
  name: string
  description: string
}

export const NEED_FINDER_INPUT_ID = "find-a-component"

const MAX_RESULTS = 8
const DESKTOP_QUERY = "(min-width: 64rem)"

const NeedSample = dynamic(
  () =>
    import("@/components/landing/need-samples").then(
      (module) => module.NeedSample
    ),
  {
    ssr: false,
    loading: () => <div className="h-9 rounded-md border bg-card/40" />,
  }
)

const NEEDS = [
  {
    slug: "tags-input",
    need: "Add tags as you type",
    detail: "Paste a comma list, remove one with Backspace.",
  },
  {
    slug: "date-time-range",
    need: "Pick a date range with times",
    detail: "Presets and typed ranges like “last 7 days”.",
  },
  {
    slug: "cron-input",
    need: "Schedule a recurring job",
    detail: "A cron field that reads back in plain English.",
  },
  {
    slug: "diff-viewer",
    need: "Show what changed in a file",
    detail: "Word-level highlights, unchanged lines folded.",
  },
  {
    slug: "filter-builder",
    need: "Let people filter a list",
    detail: "AND and OR groups that save to the URL.",
  },
]

const NEED_BY_SLUG = new Map(NEEDS.map((need) => [need.slug, need]))

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useIsDesktop() {
  return React.useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  )
}

export function searchEntries(entries: FinderEntry[], query: string) {
  const words = searchWords(query)
  if (words.length === 0) return null

  return entries
    .map((entry) => {
      const score = matchScore(
        [
          entry.name,
          entry.slug,
          entry.description,
          NEED_BY_SLUG.get(entry.slug)?.need ?? "",
        ],
        words
      )
      return { entry, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry)
}

export function NeedFinder({ entries }: { entries: FinderEntry[] }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isDesktop = useIsDesktop()
  const [query, setQuery] = React.useState("")

  useSlashFocus(inputRef)

  const matches = searchEntries(entries, query)
  const entriesBySlug = new Map(entries.map((entry) => [entry.slug, entry]))
  const rows = matches
    ? matches.slice(0, MAX_RESULTS).map((entry) => ({
        entry,
        title: entry.name,
        detail: entry.description,
      }))
    : NEEDS.flatMap(({ slug, need, detail }) => {
        const entry = entriesBySlug.get(slug)
        return entry ? [{ entry, title: need, detail }] : []
      })
  const hasMoreMatches = matches !== null && matches.length > MAX_RESULTS

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === "Escape") setQuery("")
    if (event.key === "Enter" && matches && rows[0]) {
      router.push(`/components/${rows[0].entry.slug}`)
    }
  }

  return (
    <div className="mt-10 rise [--rise-delay:200ms] md:mt-12">
      <div className="flex h-14 items-center gap-3 rounded-2xl border bg-card/70 px-4 backdrop-blur-sm transition-[border-color,box-shadow] focus-within:border-brand/60 focus-within:ring-[3px] focus-within:ring-brand/20 md:h-[4.25rem] md:px-5">
        <SearchIcon
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground"
        />
        <input
          ref={inputRef}
          id={NEED_FINDER_INPUT_ID}
          type="search"
          aria-label="Search components"
          placeholder="What are you building?"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent font-display text-lg tracking-[-0.02em] outline-none placeholder:text-muted-foreground md:text-2xl [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="hidden shrink-0 text-sm text-muted-foreground lg:block">
          Try “upload”, “schedule” or “filter”
        </span>
        <kbd className="hidden rounded-md border px-1.5 py-0.5 font-mono text-xs text-muted-foreground md:block">
          /
        </kbd>
      </div>

      {rows.length > 0 && (
        <ul
          aria-label={matches ? "Matching components" : "Things you can build"}
          className="mt-4 border-t"
        >
          {rows.map(({ entry, title, detail }) => (
            <li
              key={entry.slug}
              className="grid animate-in gap-x-8 gap-y-3 border-b py-4 duration-300 fade-in lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <Link
                  href={`/components/${entry.slug}`}
                  className="rounded-sm font-display text-xl font-semibold tracking-[-0.02em] underline-offset-4 outline-none hover:text-brand hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {title}
                </Link>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {detail}
                </p>
              </div>
              <div className="hidden max-w-lg min-w-0 lg:block">
                {isDesktop && NEED_BY_SLUG.has(entry.slug) && (
                  <NeedSample slug={entry.slug} />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 font-mono text-xs whitespace-nowrap text-muted-foreground">
                  @drift-ui/
                  <span className="text-foreground">{entry.slug}</span>
                </span>
                <CopyCommand
                  iconOnly
                  command={`npx shadcn add @drift-ui/${entry.slug}`}
                />
                <Link
                  href={`/components/${entry.slug}`}
                  aria-label={`Open ${entry.name}`}
                  className="flex size-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors outline-none hover:border-brand/40 hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {matches?.length === 0 && (
        <p className="mt-4 border-y py-8 text-muted-foreground">
          Nothing matches “{query.trim()}” yet.{" "}
          <a
            href={componentRequestUrl(query)}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            Request it as a new component
            <span className="sr-only"> (opens GitHub in a new tab)</span>
          </a>
          .
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span aria-live="polite">
          {matches
            ? `${matches.length} of ${entries.length} components match`
            : `${rows.length} of ${entries.length} components shown. Search for the rest.`}
        </span>
        <Link
          href={
            hasMoreMatches
              ? `/components?q=${encodeURIComponent(query.trim())}`
              : "/components"
          }
          prefetch={false}
          className="group flex items-center gap-1.5 font-medium text-brand"
        >
          {hasMoreMatches
            ? `See all ${matches?.length} matches`
            : "Browse every component"}
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
