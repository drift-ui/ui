"use client"

import * as React from "react"
import { SearchIcon, SearchXIcon } from "lucide-react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  addRecent,
  buildSections,
  isValidIconName,
  layoutSections,
  moveCell,
  normalizeColumns,
  normalizeIcons,
  readPreferences,
  searchIcons,
  STORAGE_KEY,
  writePreferences,
  type IconCell,
  type IconItem,
} from "@/registry/default/lib/icon-picker-utils"
import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"

const DEFAULT_COLUMNS = 6
const ROW_BATCH = 12

function subscribeToNothing() {
  return () => {}
}

function IconPlaceholder({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("rounded-sm bg-muted motion-safe:animate-pulse", className)}
    />
  )
}

function IconGlyph({ name, className }: { name: string; className?: string }) {
  if (!isValidIconName(name)) {
    return <span aria-hidden className={cn("shrink-0", className)} />
  }
  return (
    <DynamicIcon
      name={name as IconName}
      aria-hidden
      className={cn("shrink-0", className)}
      fallback={() => <IconPlaceholder className={className} />}
    />
  )
}

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
      aria-rowindex={row + 1}
      className="grid gap-0.5 pb-0.5 [contain-intrinsic-size:auto_2.5rem] [content-visibility:auto]"
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
              data-selected={isSelected || undefined}
              tabIndex={column === tabColumn ? 0 : -1}
              aria-label={item.name}
              aria-pressed={isSelected}
              title={item.name}
              className={cn(
                "flex aspect-square w-full items-center justify-center rounded-md text-muted-foreground outline-none",
                "transition-[color,background-color,scale] duration-150 ease-out motion-safe:active:scale-90",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "data-selected:bg-primary data-selected:text-primary-foreground data-selected:hover:bg-primary/90 data-selected:focus-visible:bg-primary data-selected:focus-visible:text-primary-foreground"
              )}
            >
              <IconGlyph name={item.name} className="size-5" />
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
  columns: requestedColumns = DEFAULT_COLUMNS,
  maxRecent,
  storageKey = STORAGE_KEY,
  className,
  "aria-label": ariaLabel = "Icon picker",
  ...props
}: IconPickerProps) {
  const id = React.useId()
  const gridRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const pendingFocusRef = React.useRef<IconCell | null>(null)
  const columns = normalizeColumns(requestedColumns, DEFAULT_COLUMNS)

  const [query, setQuery] = React.useState("")
  const [rowLimit, setRowLimit] = React.useState(ROW_BATCH)
  const [activeCell, setActiveCell] = React.useState<IconCell>({
    row: 0,
    column: 0,
  })
  const [previewName, setPreviewName] = React.useState<string | null>(null)
  const isHydrated = React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )
  const recentIcons = React.useMemo(
    () => (isHydrated ? readPreferences(storageKey).recent : []),
    [isHydrated, storageKey]
  )

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
  const visibleRowCount = Math.min(rowLimit, layout.rows.length)
  const tabCell = layout.rows[activeCell.row]?.[activeCell.column]
    ? activeCell
    : { row: 0, column: 0 }

  const footerName = previewName ?? (value || null)

  React.useEffect(() => {
    const cell = pendingFocusRef.current
    if (!cell) return
    pendingFocusRef.current = null
    gridRef.current
      ?.querySelector<HTMLElement>(
        `[data-row="${cell.row}"][data-column="${cell.column}"]`
      )
      ?.focus()
  }, [rowLimit])

  React.useEffect(() => {
    if (visibleRowCount >= layout.rows.length) return
    const el = gridRef.current
    if (el && el.clientHeight > 0 && el.scrollHeight <= el.clientHeight) {
      setRowLimit((current) =>
        Math.min(layout.rows.length, current + ROW_BATCH)
      )
    }
  }, [visibleRowCount, layout.rows.length])

  function focusCell(cell: IconCell) {
    setActiveCell(cell)
    if (cell.row >= rowLimit) {
      pendingFocusRef.current = cell
      setRowLimit(cell.row + ROW_BATCH)
      return
    }
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

  function updateQuery(next: string) {
    setQuery(next)
    setActiveCell({ row: 0, column: 0 })
    setRowLimit(ROW_BATCH)
    setPreviewName(null)
    if (gridRef.current) gridRef.current.scrollTop = 0
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

  function itemAt(cell: IconCell | null) {
    return cell ? layout.rows[cell.row]?.[cell.column] : undefined
  }

  function resetPointerPreview() {
    const focused =
      document.activeElement &&
      gridRef.current?.contains(document.activeElement)
        ? cellOf(document.activeElement)
        : null
    setPreviewName(itemAt(focused)?.name ?? null)
  }

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const cell = cellOf(event.target)
    if (!cell) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      const item = itemAt(cell)
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
        "flex h-96 w-80 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground",
        className
      )}
      {...props}
    >
      <div className="relative m-2 mb-1">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={searchRef}
          type="search"
          aria-label="Search icons"
          placeholder="Search icons"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="h-control-sm py-0 pl-8"
        />
      </div>
      {layout.rows.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-6 text-center">
          <SearchXIcon
            aria-hidden
            className="mb-2 size-6 text-muted-foreground"
          />
          <p className="text-sm font-medium">No icons found</p>
          <p className="max-w-full truncate text-xs text-muted-foreground">
            Nothing matches &ldquo;{needle}&rdquo;
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              updateQuery("")
              searchRef.current?.focus()
            }}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div
          ref={gridRef}
          role="grid"
          aria-label="Icons"
          aria-rowcount={layout.rows.length}
          aria-colcount={columns}
          onKeyDown={handleGridKeyDown}
          onFocus={(event) => {
            const cell = cellOf(event.target)
            if (!cell) return
            setActiveCell(cell)
            setPreviewName(itemAt(cell)?.name ?? null)
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setPreviewName(null)
            }
          }}
          onPointerOver={(event) => {
            const cell = cellOf(event.target)
            if (cell) {
              setPreviewName(itemAt(cell)?.name ?? null)
            } else {
              resetPointerPreview()
            }
          }}
          onPointerLeave={resetPointerPreview}
          onClick={(event) => {
            const item = itemAt(cellOf(event.target))
            if (item) pick(item.name)
          }}
          onScroll={(event) => {
            if (rowLimit >= layout.rows.length) return
            const el = event.currentTarget
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
              setRowLimit((current) =>
                Math.min(layout.rows.length, current + ROW_BATCH)
              )
            }
          }}
          className="relative min-h-0 flex-1 scroll-pt-7 overflow-y-auto px-2"
        >
          {layout.sections
            .filter((section) => section.firstRow < visibleRowCount)
            .map((section) => (
              <div
                key={section.id}
                id={`${id}-${section.id}`}
                role="rowgroup"
                aria-labelledby={`${id}-${section.id}-label`}
              >
                <div
                  role="presentation"
                  className="sticky top-0 z-10 flex items-baseline justify-between bg-popover pt-2 pb-1.5 text-xs text-muted-foreground"
                >
                  <span
                    id={`${id}-${section.id}-label`}
                    className="font-medium"
                  >
                    {section.label}
                  </span>
                  <span aria-hidden className="tabular-nums">
                    {section.icons.length}
                  </span>
                </div>
                {layout.rows
                  .slice(
                    section.firstRow,
                    Math.min(
                      section.firstRow + section.rowCount,
                      visibleRowCount
                    )
                  )
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
      <div
        data-slot="icon-picker-footer"
        className="flex h-11 shrink-0 items-center gap-2.5 border-t bg-muted/40 px-3 text-xs"
      >
        {footerName ? (
          <>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-foreground">
              <IconGlyph name={footerName} className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-foreground">
              {footerName}
            </span>
            {footerName === value && (
              <span className="shrink-0 text-muted-foreground">Selected</span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">No icon selected</span>
        )}
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
