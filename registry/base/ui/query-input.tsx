"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/registry/default/lib/utils"
import type { Filter, FilterField } from "@/registry/default/lib/filter"
import {
  applyQuerySuggestion,
  parseQuery,
  parseQueryTerm,
  suggestQuery,
  tokenizeQuery,
  type QuerySuggestion,
} from "@/registry/default/lib/query-input-utils"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"

const TEXT_LINE = "px-3 text-base whitespace-pre md:text-sm"

function QueryInput({
  fields,
  value,
  defaultValue = "",
  onValueChange,
  onFiltersChange,
  ref,
  onKeyDown,
  onScroll,
  className,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "onSelect" | "type"
> & {
  fields: FilterField[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onFiltersChange?: (filters: Filter[], text: string) => void
}) {
  const listId = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const highlightsRef = React.useRef<HTMLSpanElement>(null)
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)
  const { value: query, setValue: setQuery } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [caret, setCaret] = React.useState(0)
  const [dismissedStart, setDismissedStart] = React.useState<number | null>(
    null
  )
  const [browsing, setBrowsing] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)

  const suggestions = suggestQuery(query, caret, fields)
  const tokenStart = suggestions[0]?.start ?? null
  const typed = tokenStart === null ? "" : query.slice(tokenStart, caret)
  const isOpen =
    suggestions.length > 0 &&
    tokenStart !== dismissedStart &&
    (typed !== "" || browsing)
  const activeIndex = Math.min(highlightedIndex, suggestions.length - 1)
  const activeKey = tokenStart === null ? "" : `${tokenStart}:${typed}`
  const [previousKey, setPreviousKey] = React.useState(activeKey)

  if (activeKey !== previousKey) {
    setPreviousKey(activeKey)
    setHighlightedIndex(suggestions[0]?.kind === "value" ? 0 : -1)
    setBrowsing(false)
    if (tokenStart !== dismissedStart) setDismissedStart(null)
  }

  function syncScroll() {
    if (highlightsRef.current && inputRef.current) {
      highlightsRef.current.style.transform = `translateX(${-inputRef.current.scrollLeft}px)`
    }
  }

  React.useLayoutEffect(syncScroll)

  const highlights: React.ReactNode[] = []
  let index = 0
  for (const token of tokenizeQuery(query)) {
    if (!parseQueryTerm(token.text, fields)) continue
    highlights.push(
      query.slice(index, token.start),
      <span
        key={token.start}
        data-slot="query-input-filter"
        className="rounded-sm bg-primary/15"
      >
        {token.text}
      </span>
    )
    index = token.end
  }
  highlights.push(query.slice(index))

  function change(next: string) {
    setQuery(next)
    const { filters, text } = parseQuery(next, fields)
    onFiltersChange?.(filters, text)
  }

  function selectSuggestion(suggestion: QuerySuggestion) {
    const next = applyQuerySuggestion(query, suggestion)
    flushSync(() => {
      change(next.query)
      setCaret(next.caret)
    })
    inputRef.current?.setSelectionRange(next.caret, next.caret)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (!isOpen) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        event.preventDefault()
        setBrowsing(true)
        setDismissedStart(null)
        setHighlightedIndex(0)
      }
      return
    }
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault()
        const count = suggestions.length
        setHighlightedIndex(
          event.key === "ArrowDown"
            ? (activeIndex + 1) % count
            : (Math.max(activeIndex, 0) - 1 + count) % count
        )
        return
      }
      case "Enter":
      case "Tab":
        if (activeIndex < 0) return
        event.preventDefault()
        selectSuggestion(suggestions[activeIndex])
        return
      case "Escape":
        event.preventDefault()
        setDismissedStart(tokenStart)
        return
    }
  }

  return (
    <PopoverPrimitive.Root
      open={isOpen}
      onOpenChange={(open, { event, reason }) => {
        if (open) return
        if (
          reason === "outside-press" &&
          rootRef.current?.contains(event.target as Node)
        )
          return
        setDismissedStart(tokenStart)
      }}
    >
      <div
        ref={rootRef}
        data-slot="query-input"
        className={cn(
          "relative flex h-control w-full min-w-0 rounded-control border border-input bg-transparent shadow-control transition-[color,box-shadow] dark:bg-input/30",
          "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50",
          "has-aria-invalid:border-destructive has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
          className
        )}
      >
        <div
          aria-hidden
          data-slot="query-input-highlights"
          className={cn(
            TEXT_LINE,
            "pointer-events-none absolute inset-0 flex items-center overflow-hidden text-transparent select-none"
          )}
        >
          <span ref={highlightsRef}>{highlights}</span>
        </div>
        <input
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            change(event.target.value)
            setCaret(event.target.selectionStart ?? 0)
          }}
          onSelect={(event) =>
            setCaret(event.currentTarget.selectionStart ?? 0)
          }
          onKeyDown={handleKeyDown}
          onScroll={(event) => {
            syncScroll()
            onScroll?.(event)
          }}
          className={cn(
            TEXT_LINE,
            "relative h-full w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          )}
          {...props}
        />
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={rootRef}
          align="start"
          sideOffset={4}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            initialFocus={false}
            finalFocus={false}
            className="z-50 w-64 origin-(--transform-origin) rounded-box border bg-popover p-1 text-popover-foreground shadow-md outline-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
          >
            <ul id={listId} role="listbox" data-slot="query-input-list">
              {suggestions.map((suggestion, suggestionIndex) => (
                <li
                  key={suggestion.value}
                  id={`${listId}-${suggestionIndex}`}
                  role="option"
                  aria-selected={suggestionIndex === activeIndex}
                  onPointerDown={(event) => event.preventDefault()}
                  onPointerMove={() => setHighlightedIndex(suggestionIndex)}
                  onClick={() => selectSuggestion(suggestion)}
                  className="flex cursor-default items-baseline justify-between gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  {suggestion.label}
                  <span className="font-mono text-xs text-muted-foreground">
                    {suggestion.kind === "key"
                      ? `${suggestion.value}:`
                      : suggestion.value}
                  </span>
                </li>
              ))}
            </ul>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { QueryInput }
