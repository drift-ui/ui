"use client"

import * as React from "react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  addRecent,
  buildSections,
  isValidIconName,
  layoutSections,
  moveCell,
  normalizeIcons,
  readPreferences,
  searchIcons,
  STORAGE_KEY,
  writePreferences,
  type IconCell,
  type IconItem,
} from "@/registry/default/lib/icon-picker-utils"
import { cn } from "@/registry/default/lib/utils"
import { Input } from "@/registry/default/ui/input"

const DEFAULT_COLUMNS = 6

const IconRow = React.memo(function IconRow({
  icons,
  row,
  tabColumn,
  selectedValue,
  columns,
}: {
  icons: IconItem[]
  row: number
  tabColumn: number | null
  selectedValue?: string
  columns: number
}) {
  return (
    <div
      role="row"
      className="grid [contain-intrinsic-size:auto_2.5rem] [content-visibility:auto]"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {icons.map((item, column) => {
        const isSelected = selectedValue === item.name
        return (
          <div
            key={`${item.name}-${column}`}
            role="gridcell"
            aria-selected={isSelected}
          >
            <button
              type="button"
              data-row={row}
              data-column={column}
              tabIndex={column === tabColumn ? 0 : -1}
              aria-label={item.name}
              aria-pressed={isSelected}
              title={item.name}
              className={cn(
                "flex aspect-square w-full items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                isSelected && "bg-accent font-medium text-accent-foreground"
              )}
            >
              {isValidIconName(item.name) ? (
                <DynamicIcon
                  name={item.name as IconName}
                  className="size-5 shrink-0"
                />
              ) : (
                <span className="size-5 shrink-0" />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
})

export interface IconPickerProps extends Omit<
  React.ComponentProps<"div">,
  "onSelect" | "defaultValue"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onSelect?: (value: string) => void
  icons?: (string | IconItem)[]
  tags?: Record<string, string[]>
  columns?: number
  maxRecent?: number
  storageKey?: string
}

function IconPicker({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  onSelect,
  icons: userIcons,
  tags,
  columns = DEFAULT_COLUMNS,
  maxRecent,
  storageKey = STORAGE_KEY,
  className,
  "aria-label": ariaLabel = "Icon picker",
  ...props
}: IconPickerProps) {
  const id = React.useId()
  const gridRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const [query, setQuery] = React.useState("")
  const [activeCell, setActiveCell] = React.useState<IconCell>({
    row: 0,
    column: 0,
  })
  const [recentIcons] = React.useState<string[]>(() => {
    return typeof window !== "undefined"
      ? readPreferences(storageKey).recent
      : []
  })

  const { value, setValue } = useControllableState({
    value: controlledValue,
    defaultValue,
    onChange: onValueChange,
  })

  const allIcons = React.useMemo(() => normalizeIcons(userIcons), [userIcons])

  const needle = query.trim()
  const layout = React.useMemo(() => {
    const sections = needle
      ? [
          {
            id: "results",
            label: "Search results",
            icons: searchIcons(allIcons, needle, tags),
          },
        ]
      : buildSections(allIcons, recentIcons)

    return layoutSections(sections, columns)
  }, [allIcons, needle, tags, recentIcons, columns])

  const resultCount = needle ? (layout.sections[0]?.icons.length ?? 0) : null
  const tabCell = layout.rows[activeCell.row]?.[activeCell.column]
    ? activeCell
    : { row: 0, column: 0 }

  function focusCell(cell: IconCell) {
    setActiveCell(cell)
    gridRef.current
      ?.querySelector<HTMLElement>(
        `[data-row="${cell.row}"][data-column="${cell.column}"]`
      )
      ?.focus()
  }

  function pick(name: string) {
    const preferences = readPreferences(storageKey)
    writePreferences(
      {
        ...preferences,
        recent: addRecent(preferences.recent, name, maxRecent),
      },
      storageKey
    )
    setValue(name)
    onSelect?.(name)
  }

  function cellOf(target: EventTarget) {
    const button = (target as HTMLElement).closest<HTMLElement>("[data-row]")
    return button
      ? {
          row: Number(button.dataset.row),
          column: Number(button.dataset.column),
        }
      : null
  }

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const cell = cellOf(event.target)
    if (!cell) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      const item = layout.rows[cell.row]?.[cell.column]
      if (item) pick(item.name)
      return
    }

    const next = moveCell(
      layout.rows.map((row) => row.length),
      layout.sections.map((section) => section.firstRow),
      cell,
      event.key,
      event.ctrlKey || event.metaKey
    )
    if (!next) return
    event.preventDefault()

    if (event.key === "ArrowUp" && cell.row === 0) {
      searchRef.current?.focus()
    } else {
      focusCell(next)
    }
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      focusCell(tabCell)
    }
    if (event.key === "Enter" && needle && layout.rows[0]?.[0]) {
      event.preventDefault()
      pick(layout.rows[0][0].name)
    }
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="icon-picker"
      className={cn(
        "flex h-96 w-80 flex-col gap-2 rounded-lg border bg-popover p-2 text-popover-foreground",
        className
      )}
      {...props}
    >
      <Input
        ref={searchRef}
        type="search"
        aria-label="Search icons"
        placeholder="Search icons"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveCell({ row: 0, column: 0 })
          if (gridRef.current) gridRef.current.scrollTop = 0
        }}
        onKeyDown={handleSearchKeyDown}
        className="h-control-sm py-0"
      />
      {layout.rows.length === 0 ? (
        <p className="min-h-0 flex-1 p-2 text-sm text-muted-foreground">
          No icons found
        </p>
      ) : (
        <div
          ref={gridRef}
          role="grid"
          aria-label="Icons"
          aria-colcount={columns}
          onKeyDown={handleGridKeyDown}
          onFocus={(event) => {
            const cell = cellOf(event.target)
            if (cell) setActiveCell(cell)
          }}
          onClick={(event) => {
            const cell = cellOf(event.target)
            if (cell) pick(layout.rows[cell.row][cell.column].name)
          }}
          className="relative min-h-0 flex-1 overflow-y-auto"
        >
          {layout.sections.map((section) => (
            <div
              key={section.id}
              id={`${id}-${section.id}`}
              role="rowgroup"
              aria-labelledby={`${id}-${section.id}-label`}
            >
              <div
                id={`${id}-${section.id}-label`}
                role="presentation"
                className="sticky top-0 z-10 bg-popover py-1 text-xs font-medium text-muted-foreground"
              >
                {section.label}
              </div>
              {layout.rows
                .slice(section.firstRow, section.firstRow + section.rowCount)
                .map((rowIcons, offset) => {
                  const row = section.firstRow + offset
                  return (
                    <IconRow
                      key={row}
                      icons={rowIcons}
                      row={row}
                      tabColumn={row === tabCell.row ? tabCell.column : null}
                      selectedValue={value}
                      columns={columns}
                    />
                  )
                })}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border/60 px-1 pt-1.5 text-xs text-muted-foreground">
        <span>Selected</span>
        <span className="max-w-[180px] truncate font-mono text-foreground">
          {value || "None"}
        </span>
      </div>
      <span role="status" className="sr-only">
        {resultCount === null
          ? ""
          : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
      </span>
    </div>
  )
}

export { IconPicker }
