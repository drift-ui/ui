"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import {
  filterOptions,
  groupOptions,
  toggleAll,
  toggleValue,
  type MultiSelectOption,
} from "@/registry/default/lib/multi-select.ts"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Badge } from "@/registry/default/ui/badge"

function SelectionMark({ checked }: { checked: boolean }) {
  return (
    <span
      data-checked={checked ? "" : undefined}
      className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground"
    >
      {checked && <CheckIcon className="size-3" />}
    </span>
  )
}

function MultiSelect({
  options,
  value,
  defaultValue = [],
  onValueChange,
  maxSelected,
  maxVisibleChips,
  disabled,
  placeholder,
  className,
  onKeyDown,
  onBlur,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  options: MultiSelectOption[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  maxSelected?: number
  maxVisibleChips?: number
}) {
  const listId = React.useId()
  const fieldRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { value: selected, setValue: setSelected } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [announcement, setAnnouncement] = React.useState("")

  const groups = groupOptions(filterOptions(options, query))
  const visibleOptions = groups.flatMap((group) => group.options)
  const hasSelectAll = maxSelected === undefined && visibleOptions.length > 1
  const offset = hasSelectAll ? 1 : 0
  const itemCount = visibleOptions.length + offset
  const isFull = maxSelected !== undefined && selected.length >= maxSelected
  const allVisibleSelected = visibleOptions.every((option) =>
    selected.includes(option.value)
  )
  const chipCount = maxVisibleChips ?? selected.length
  const hiddenCount = Math.max(0, selected.length - chipCount)

  React.useEffect(() => {
    if (!isOpen) return
    document
      .getElementById(`${listId}-${highlightedIndex}`)
      ?.scrollIntoView({ block: "nearest" })
  }, [isOpen, highlightedIndex, listId])

  function labelOf(optionValue: string) {
    return (
      options.find((option) => option.value === optionValue)?.label ??
      optionValue
    )
  }

  function open() {
    if (disabled || isOpen) return
    setHighlightedIndex(0)
    setIsOpen(true)
  }

  function activate(index: number) {
    setActiveIndex(null)
    if (hasSelectAll && index === 0) {
      setSelected(toggleAll(selected, visibleOptions))
      setAnnouncement(
        allVisibleSelected ? "Cleared matching options" : "Selected all"
      )
      return
    }
    const option = visibleOptions[index - offset]
    if (!option) return
    const next = toggleValue(selected, option.value, maxSelected)
    if (next === selected) {
      setAnnouncement(`Limit of ${maxSelected} reached`)
      return
    }
    setSelected(next)
    setQuery("")
    setHighlightedIndex(0)
    setAnnouncement(
      next.length > selected.length
        ? `Added ${option.label}`
        : `Removed ${option.label}`
    )
  }

  function selectChip(index: number | null) {
    setActiveIndex(index)
    if (index === null) return
    setAnnouncement(
      `${labelOf(selected[index])} selected, ${index + 1} of ${selected.length}. Press Backspace to remove`
    )
  }

  function removeAt(index: number) {
    const removed = selected[index]
    setSelected(selected.filter((_, itemIndex) => itemIndex !== index))
    setActiveIndex(null)
    setAnnouncement(`Removed ${labelOf(removed)}`)
    inputRef.current?.focus()
  }

  function clear() {
    setSelected([])
    setActiveIndex(null)
    setAnnouncement("Cleared selection")
    inputRef.current?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const { selectionStart, selectionEnd } = event.currentTarget
    const isCaretAtStart = selectionStart === 0 && selectionEnd === 0
    const lastIndex = selected.length - 1

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault()
        setActiveIndex(null)
        if (!isOpen) return open()
        if (itemCount === 0) return
        const delta = event.key === "ArrowDown" ? 1 : -1
        setHighlightedIndex((highlightedIndex + delta + itemCount) % itemCount)
        return
      }
      case "Enter":
        if (!isOpen || itemCount === 0) return
        event.preventDefault()
        activate(highlightedIndex)
        return
      case "Escape":
        setActiveIndex(null)
        if (!isOpen) return
        event.preventDefault()
        setIsOpen(false)
        return
      case "Backspace":
        if (!isCaretAtStart || selected.length === 0) return
        event.preventDefault()
        if (activeIndex === null) selectChip(lastIndex)
        else removeAt(activeIndex)
        return
      case "Delete":
        if (activeIndex === null) return
        event.preventDefault()
        removeAt(activeIndex)
        return
      case "ArrowLeft":
        if (!isCaretAtStart || selected.length === 0) return
        event.preventDefault()
        selectChip(
          activeIndex === null ? lastIndex : Math.max(0, activeIndex - 1)
        )
        return
      case "ArrowRight":
        if (activeIndex === null) return
        event.preventDefault()
        selectChip(activeIndex >= lastIndex ? null : activeIndex + 1)
        return
      default:
        setActiveIndex(null)
    }
  }

  function renderOption(option: MultiSelectOption) {
    const index = visibleOptions.indexOf(option) + offset
    const isSelected = selected.includes(option.value)
    return (
      <div
        key={option.value}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={isSelected}
        aria-disabled={isFull && !isSelected ? true : undefined}
        data-highlighted={index === highlightedIndex ? "" : undefined}
        onPointerMove={() => setHighlightedIndex(index)}
        onClick={() => activate(index)}
        className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-disabled:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
      >
        <SelectionMark checked={isSelected} />
        {option.label}
      </div>
    )
  }

  return (
    <PopoverPrimitive.Root
      open={isOpen}
      onOpenChange={(nextOpen, { event }) => {
        if (nextOpen) return
        if (fieldRef.current?.contains(event.target as Node)) return
        setIsOpen(false)
      }}
    >
      <div
        ref={fieldRef}
        data-slot="multi-select"
        data-disabled={disabled ? "" : undefined}
        onClick={() => {
          inputRef.current?.focus()
          open()
        }}
        className={cn(
          "flex min-h-control w-full min-w-0 cursor-text flex-wrap items-center gap-1.5 rounded-control border border-input bg-transparent px-2 py-1.5 text-base shadow-control transition-[color,box-shadow] md:text-sm dark:bg-input/30",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
      >
        {selected.slice(0, chipCount).map((item, index) => (
          <Badge
            key={item}
            data-slot="multi-select-chip"
            data-active={activeIndex === index ? "" : undefined}
            variant="secondary"
            className="gap-1 pr-1 data-[active]:ring-2 data-[active]:ring-ring"
          >
            {labelOf(item)}
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Remove ${labelOf(item)}`}
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation()
                removeAt(index)
              }}
              className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
        {hiddenCount > 0 && (
          <Badge
            data-slot="multi-select-overflow"
            data-active={
              activeIndex !== null && activeIndex >= chipCount ? "" : undefined
            }
            variant="outline"
            className="data-[active]:ring-2 data-[active]:ring-ring"
          >
            +{hiddenCount}
          </Badge>
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          data-slot="multi-select-input"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={
            isOpen && itemCount > 0
              ? `${listId}-${highlightedIndex}`
              : undefined
          }
          value={query}
          disabled={disabled}
          placeholder={selected.length === 0 ? placeholder : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlightedIndex(0)
            setActiveIndex(null)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            onBlur?.(event)
            setActiveIndex(null)
            setIsOpen(false)
          }}
          className="h-6 min-w-20 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          {...props}
        />
        {selected.length > 0 && (
          <button
            type="button"
            aria-label="Clear selection"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              clear()
            }}
            className="ml-auto rounded-sm p-0.5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-4" />
          </button>
        )}
        <span role="status" aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={fieldRef}
          align="start"
          sideOffset={4}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            initialFocus={false}
            finalFocus={false}
            onPointerDown={(event) => event.preventDefault()}
            className="z-50 w-(--anchor-width) origin-(--transform-origin) rounded-box border bg-popover p-1 text-popover-foreground shadow-md outline-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
          >
            {itemCount === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No results
              </p>
            ) : (
              <div
                id={listId}
                role="listbox"
                aria-multiselectable="true"
                data-slot="multi-select-list"
                className="max-h-64 overflow-y-auto"
              >
                {hasSelectAll && (
                  <div
                    id={`${listId}-0`}
                    role="option"
                    aria-selected={allVisibleSelected}
                    data-highlighted={highlightedIndex === 0 ? "" : undefined}
                    onPointerMove={() => setHighlightedIndex(0)}
                    onClick={() => activate(0)}
                    className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <SelectionMark checked={allVisibleSelected} />
                    Select all
                  </div>
                )}
                {groups.map((group, groupIndex) =>
                  group.label ? (
                    <div
                      key={group.label}
                      role="group"
                      aria-labelledby={`${listId}-group-${groupIndex}`}
                    >
                      <div
                        id={`${listId}-group-${groupIndex}`}
                        role="presentation"
                        className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground"
                      >
                        {group.label}
                      </div>
                      {group.options.map(renderOption)}
                    </div>
                  ) : (
                    <React.Fragment key="">
                      {group.options.map(renderOption)}
                    </React.Fragment>
                  )
                )}
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { MultiSelect, type MultiSelectOption }
