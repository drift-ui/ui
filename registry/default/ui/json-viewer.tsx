"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, RouteIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { useCopyToClipboard } from "@/registry/default/hooks/use-copy-to-clipboard"
import {
  childEntries,
  DEFAULT_MAX_STRING_LENGTH,
  expandedToDepth,
  filterByPath,
  formatValue,
  rootEntries,
  searchJson,
  sizeOf,
  truncateString,
  type JsonEntry,
} from "@/registry/default/lib/json-viewer.ts"
import { cn } from "@/registry/default/lib/utils"
import { Input } from "@/registry/default/ui/input"
import { TreeView, type TreeNode } from "@/registry/default/ui/tree-view"

type CopyTarget = "value" | "path"

const TYPE_CLASSES: Record<string, string> = {
  string: "text-[color-mix(in_oklab,var(--chart-2)_65%,var(--foreground))]",
  number: "text-[color-mix(in_oklab,var(--chart-1)_65%,var(--foreground))]",
  boolean: "text-[color-mix(in_oklab,var(--chart-3)_65%,var(--foreground))]",
  object: "text-muted-foreground italic",
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-chart-4/40 text-inherit">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  )
}

function ValueText({
  value,
  query,
  maxStringLength = DEFAULT_MAX_STRING_LENGTH,
  virtual = false,
}: {
  value: unknown
  query: string
  maxStringLength?: number
  virtual?: boolean
}) {
  const [prevQuery, setPrevQuery] = React.useState(query)
  const [userExpanded, setUserExpanded] = React.useState<boolean | null>(null)

  if (prevQuery !== query) {
    setPrevQuery(query)
    setUserExpanded(null)
  }

  if (Array.isArray(value)) {
    return (
      <span className="text-muted-foreground">
        {value.length === 0 ? "[]" : `Array(${value.length})`}
      </span>
    )
  }
  if (typeof value === "object" && value !== null) {
    return (
      <span className="text-muted-foreground">
        {sizeOf(value) === 0 ? "{}" : "{…}"}
      </span>
    )
  }

  if (typeof value === "string") {
    const { isLong, preview } = truncateString(value, maxStringLength)
    const valueHasMatch = Boolean(
      query && value.toLowerCase().includes(query.toLowerCase())
    )
    const isExpanded = userExpanded ?? valueHasMatch

    return (
      <span
        className={cn(
          TYPE_CLASSES.string,
          virtual
            ? "inline-flex max-w-full flex-nowrap items-center gap-1 overflow-hidden"
            : "inline-flex flex-wrap items-center gap-1"
        )}
      >
        &quot;
        {isLong && !isExpanded ? (
          <>
            <span
              className={cn(
                virtual && "max-w-[300px] min-w-0 truncate align-middle"
              )}
            >
              <Highlight text={preview} query={query} />
            </span>
            <span className="shrink-0 text-muted-foreground">…</span>
            <button
              type="button"
              aria-expanded={false}
              aria-label="Expand string"
              onClick={(event) => {
                event.stopPropagation()
                setUserExpanded(true)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation()
                }
              }}
              className="shrink-0 cursor-pointer text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              Show more
            </button>
          </>
        ) : isLong && isExpanded ? (
          <>
            <span
              className={cn(
                virtual
                  ? "inline-block max-w-[400px] overflow-x-auto align-middle whitespace-nowrap"
                  : "whitespace-pre-wrap"
              )}
            >
              <Highlight text={value} query={query} />
            </span>
            <button
              type="button"
              aria-expanded={true}
              aria-label="Collapse string"
              onClick={(event) => {
                event.stopPropagation()
                setUserExpanded(false)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation()
                }
              }}
              className="shrink-0 cursor-pointer text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              Show less
            </button>
          </>
        ) : (
          <Highlight text={value} query={query} />
        )}
        &quot;
      </span>
    )
  }

  const text = String(value)
  return (
    <span className={TYPE_CLASSES[typeof value]}>
      <Highlight text={text} query={query} />
    </span>
  )
}

function JsonViewer({
  data,
  defaultExpandDepth = 1,
  onCopy,
  virtual = false,
  maxStringLength = DEFAULT_MAX_STRING_LENGTH,
  pathFilter,
  defaultPathFilter = "",
  onPathFilterChange,
  className,
  "aria-label": ariaLabel = "JSON",
  ...props
}: Omit<React.ComponentProps<"div">, "onCopy"> & {
  data: unknown
  defaultExpandDepth?: number
  onCopy?: (path: string, value: unknown, target: CopyTarget) => void
  virtual?: boolean
  maxStringLength?: number
  pathFilter?: string
  defaultPathFilter?: string
  onPathFilterChange?: (path: string) => void
}) {
  const { value: pathFilterState = "", setValue: setPathFilterState } =
    useControllableState({
      value: pathFilter,
      defaultValue: defaultPathFilter ?? "",
      onChange: onPathFilterChange,
    })
  const activePathFilter = pathFilterState.trim()
  const [showPathFilterInput, setShowPathFilterInput] = React.useState(() =>
    Boolean(activePathFilter)
  )

  const filteredData = React.useMemo(() => {
    if (!activePathFilter) return data
    return filterByPath(data, activePathFilter)
  }, [data, activePathFilter])

  const [expanded, setExpanded] = React.useState(() =>
    expandedToDepth(filteredData, defaultExpandDepth)
  )
  const [query, setQuery] = React.useState("")
  const deferredQuery = React.useDeferredValue(query)
  const { copied, copy } = useCopyToClipboard()
  const needle = deferredQuery.trim()
  const { matches, ancestors } = React.useMemo(
    () => searchJson(filteredData, needle),
    [filteredData, needle]
  )
  const [prevNeedle, setPrevNeedle] = React.useState(needle)
  const [collapsedAncestors, setCollapsedAncestors] = React.useState<
    Set<string>
  >(() => new Set())

  if (prevNeedle !== needle) {
    setPrevNeedle(needle)
    setCollapsedAncestors(new Set())
  }

  const effectiveExpanded = React.useMemo(() => {
    if (!needle) return expanded
    const result = new Set(expanded)
    for (const id of ancestors) {
      if (!collapsedAncestors.has(id)) {
        result.add(id)
      }
    }
    return [...result]
  }, [expanded, needle, ancestors, collapsedAncestors])
  const expandedIds = new Set(effectiveExpanded)
  const entriesById = new Map<string, JsonEntry>()

  function handleExpandedChange(next: string[]) {
    if (!needle) {
      setExpanded(next)
      return
    }

    const prevSet = new Set(effectiveExpanded)
    const nextSet = new Set(next)

    const added = next.filter((id) => !prevSet.has(id))
    const removed = effectiveExpanded.filter((id) => !nextSet.has(id))

    if (added.length > 0) {
      setExpanded((prev) => [...new Set([...prev, ...added])])
      if (collapsedAncestors.size > 0) {
        setCollapsedAncestors((prev) => {
          const updated = new Set(prev)
          for (const id of added) updated.delete(id)
          return updated
        })
      }
    }

    if (removed.length > 0) {
      const removedSet = new Set(removed)
      setExpanded((prev) => prev.filter((id) => !removedSet.has(id)))
      const removedAncestors = removed.filter((id) => ancestors.has(id))
      if (removedAncestors.length > 0) {
        setCollapsedAncestors((prev) => {
          const updated = new Set(prev)
          for (const id of removedAncestors) updated.add(id)
          return updated
        })
      }
    }
  }

  function copyEntry(entry: JsonEntry, target: CopyTarget) {
    const text = target === "value" ? formatValue(entry.value) : entry.path
    copy(text, `${target}:${entry.id}`).then(() =>
      onCopy?.(entry.path, entry.value, target)
    )
  }

  function search(next: string) {
    setQuery(next)
  }

  function renderRow(entry: JsonEntry) {
    if (entry.range) {
      return (
        <span
          data-json-id={entry.id}
          className="font-mono text-xs text-muted-foreground"
        >
          [{entry.range[0]} … {entry.range[1]}]
        </span>
      )
    }

    return (
      <span
        data-json-id={entry.id}
        className="inline-flex min-w-0 items-center gap-1.5 font-mono text-xs"
      >
        {entry.key !== null && (
          <span
            className={
              typeof entry.key === "number"
                ? "text-muted-foreground"
                : "text-foreground"
            }
          >
            <Highlight
              text={String(entry.key)}
              query={typeof entry.key === "string" ? needle : ""}
            />
            :
          </span>
        )}
        <ValueText
          value={entry.value}
          query={needle}
          maxStringLength={maxStringLength}
          virtual={virtual}
        />
        <span
          aria-hidden
          className="inline-flex opacity-0 transition-opacity pointer-coarse:opacity-100 [[role=treeitem]:focus-visible_&]:opacity-100 [[role=treeitem]:hover_&]:opacity-100"
        >
          {(["value", "path"] as const).map((target) => (
            <button
              key={target}
              type="button"
              tabIndex={-1}
              aria-label={`Copy ${target}`}
              onClick={(event) => {
                event.stopPropagation()
                copyEntry(entry, target)
              }}
              className="inline-flex size-6 items-center justify-center rounded-sm hover:bg-background"
            >
              {copied === `${target}:${entry.id}` ? (
                <CheckIcon />
              ) : target === "value" ? (
                <CopyIcon />
              ) : (
                <RouteIcon />
              )}
            </button>
          ))}
        </span>
      </span>
    )
  }

  function toNodes(entries: JsonEntry[]): TreeNode[] {
    return entries.map((entry) => {
      entriesById.set(entry.id, entry)
      return {
        id: entry.id,
        label: renderRow(entry),
        textValue: entry.key === null ? "" : String(entry.key),
        isBranch: entry.isBranch,
        children:
          entry.isBranch && expandedIds.has(entry.id)
            ? toNodes(childEntries(entry.value, entry.path, entry.range))
            : undefined,
      }
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key.toLowerCase() !== "c") return
    if (!(event.metaKey || event.ctrlKey)) return
    if (window.getSelection()?.toString()) return
    const id = (event.target as HTMLElement).querySelector<HTMLElement>(
      "[data-json-id]"
    )?.dataset.jsonId
    const entry = id ? entriesById.get(id) : undefined
    if (!entry || entry.range) return
    event.preventDefault()
    copyEntry(entry, event.shiftKey ? "path" : "value")
  }

  return (
    <div
      data-slot="json-viewer"
      className={cn("flex flex-col gap-2 rounded-lg border p-2", className)}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            aria-label="Search keys and values"
            placeholder="Search keys and values"
            value={query}
            onChange={(event) => search(event.target.value)}
            className="h-control-sm"
          />
          <button
            type="button"
            aria-label="Filter by path"
            aria-pressed={showPathFilterInput}
            onClick={() => setShowPathFilterInput((prev) => !prev)}
            className={cn(
              "inline-flex size-control-sm shrink-0 items-center justify-center rounded-control border text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
              (showPathFilterInput || activePathFilter) &&
                "border-primary bg-accent text-primary"
            )}
          >
            <RouteIcon className="size-3.5" />
          </button>
          <span
            role="status"
            className="shrink-0 text-xs text-muted-foreground"
          >
            {needle &&
              `${matches.size} ${matches.size === 1 ? "match" : "matches"}`}
          </span>
        </div>
        {(showPathFilterInput || activePathFilter) && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              aria-label="Filter path pattern"
              placeholder="Filter path pattern, e.g. users[*].email"
              value={pathFilterState}
              onChange={(e) => setPathFilterState(e.target.value)}
              className="h-control-sm font-mono text-xs"
            />
            {activePathFilter && (
              <button
                type="button"
                aria-label="Clear path filter"
                onClick={() => setPathFilterState("")}
                className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
      <TreeView
        aria-label={ariaLabel}
        items={toNodes(rootEntries(filteredData))}
        expanded={effectiveExpanded}
        onExpandedChange={handleExpandedChange}
        onKeyDown={handleKeyDown}
        virtual={virtual}
        className="overflow-auto"
      />
      <span role="status" className="sr-only">
        {copied ? `Copied ${copied.slice(0, copied.indexOf(":"))}` : ""}
      </span>
    </div>
  )
}

export { JsonViewer }
