"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  filterLocales,
  isValidLocale,
  listLocales,
  normalizeLocale,
  type LocaleOption,
} from "@/registry/default/lib/locale-picker-utils"
import { cn } from "@/registry/default/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

function scrollOptionIntoList(option: HTMLElement | null) {
  option?.scrollIntoView({ block: "nearest" })
}

export type LocalePickerProps = Omit<
  React.ComponentProps<"button">,
  "value" | "defaultValue" | "children"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  locales?: string[]
  displayLocale?: string
  placeholder?: string
  searchPlaceholder?: string
  name?: string
  showTag?: boolean
}

function LocalePicker({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  locales,
  displayLocale = "en",
  placeholder = "Select a locale",
  searchPlaceholder = "Search locales",
  disabled,
  name,
  showTag = true,
  className,
  ...props
}: LocalePickerProps) {
  const listId = React.useId()
  const { value, setValue } = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })

  const normalized = normalizeLocale(value)
  const current = normalized && isValidLocale(normalized) ? normalized : ""

  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [highlighted, setHighlighted] = React.useState<number | null>(null)

  const options = React.useMemo(
    () => listLocales(locales, displayLocale),
    [locales, displayLocale]
  )

  const currentOption = React.useMemo<LocaleOption | null>(() => {
    if (!current) return null
    const found = options.find((option) => option.value === current)
    if (found) return found
    const custom = listLocales([current], displayLocale)
    return custom[0] ?? null
  }, [options, current, displayLocale])

  const matches = filterLocales(options, query)
  const highlightedIndex = Math.min(
    highlighted ??
      Math.max(
        0,
        matches.findIndex((option) => option.value === current)
      ),
    Math.max(0, matches.length - 1)
  )

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen)
    if (!nextOpen) return
    setQuery("")
    setHighlighted(null)
  }

  function select(next: string) {
    setValue(next)
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // Leave keys that confirm an IME composition to the IME.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault()
        if (matches.length === 0) return
        const delta = event.key === "ArrowDown" ? 1 : -1
        setHighlighted(
          (highlightedIndex + delta + matches.length) % matches.length
        )
        return
      }
      case "Enter": {
        event.preventDefault()
        const match = matches[highlightedIndex]
        if (match) select(match.value)
        return
      }
    }
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listId : undefined}
          disabled={disabled}
          data-slot="locale-picker"
          className={cn(
            "flex h-control w-full min-w-0 items-center gap-2 rounded-control border border-input bg-transparent px-3 text-left text-sm shadow-control outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
            className
          )}
          {...props}
        >
          {currentOption ? (
            <>
              {currentOption.flag && (
                <span
                  className="shrink-0 text-base leading-none"
                  aria-hidden="true"
                >
                  {currentOption.flag}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">
                {currentOption.label}
              </span>
              {showTag && (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {currentOption.value}
                </span>
              )}
            </>
          ) : (
            <span className="flex-1 text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label="Choose a locale"
          className="flex w-80 flex-col gap-1 p-1"
        >
          <input
            type="text"
            role="combobox"
            data-slot="locale-picker-search"
            aria-label="Search locales"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              matches.length > 0 ? `${listId}-${highlightedIndex}` : undefined
            }
            value={query}
            placeholder={searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlighted(0)
            }}
            onKeyDown={handleKeyDown}
            className="h-8 w-full rounded-sm bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div
            id={listId}
            role="listbox"
            aria-label="Locales"
            data-slot="locale-picker-list"
            className="relative max-h-64 overflow-y-auto"
          >
            {matches.map((option, index) => (
              <div
                key={option.value}
                ref={
                  index === highlightedIndex ? scrollOptionIntoList : undefined
                }
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === current}
                data-highlighted={index === highlightedIndex ? "" : undefined}
                onPointerMove={() => setHighlighted(index)}
                onClick={() => select(option.value)}
                className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
              >
                {option.flag && (
                  <span
                    className="shrink-0 text-base leading-none"
                    aria-hidden="true"
                  >
                    {option.flag}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {showTag && (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {option.value}
                  </span>
                )}
                {option.value === current && (
                  <CheckIcon className="size-4 shrink-0" />
                )}
              </div>
            ))}
          </div>
          {matches.length === 0 && (
            <p
              role="status"
              className="px-2 py-1.5 text-sm text-muted-foreground"
            >
              No locale found
            </p>
          )}
        </PopoverContent>
      </Popover>
      {name && (
        <input type="hidden" name={name} value={current} disabled={disabled} />
      )}
    </>
  )
}

export { LocalePicker }
