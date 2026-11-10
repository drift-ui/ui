"use client"

import * as React from "react"
import {
  AppleIcon,
  ClockIcon,
  FlagIcon,
  HandIcon,
  HashIcon,
  LightbulbIcon,
  PawPrintIcon,
  PlaneIcon,
  SmileIcon,
  TrophyIcon,
  type LucideIcon,
} from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  addRecent,
  buildSections,
  layoutSections,
  loadEmojis,
  moveCell,
  readPreferences,
  RECENT_SECTION_ID,
  searchEmojis,
  withSkinTone,
  writePreferences,
  type Emoji,
  type EmojiCell,
  type SkinTone,
} from "@/registry/default/lib/emoji-picker.ts"
import { cn } from "@/registry/default/lib/utils"
import { Input } from "@/registry/default/ui/input"

const COLUMNS = 8

const SECTION_ICONS: Record<string, LucideIcon> = {
  [RECENT_SECTION_ID]: ClockIcon,
  "0": SmileIcon,
  "1": HandIcon,
  "3": PawPrintIcon,
  "4": AppleIcon,
  "5": PlaneIcon,
  "6": TrophyIcon,
  "7": LightbulbIcon,
  "8": HashIcon,
  "9": FlagIcon,
}

const SKIN_TONES: { tone: SkinTone; emoji: string; label: string }[] = [
  { tone: 0, emoji: "✋", label: "Default" },
  { tone: 1, emoji: "✋🏻", label: "Light" },
  { tone: 2, emoji: "✋🏼", label: "Medium-light" },
  { tone: 3, emoji: "✋🏽", label: "Medium" },
  { tone: 4, emoji: "✋🏾", label: "Medium-dark" },
  { tone: 5, emoji: "✋🏿", label: "Dark" },
]

const EmojiRow = React.memo(function EmojiRow({
  emojis,
  row,
  tabColumn,
  skinTone,
}: {
  emojis: Emoji[]
  row: number
  tabColumn: number | null
  skinTone: SkinTone
}) {
  return (
    <div
      role="row"
      className="grid grid-cols-8 [contain-intrinsic-size:auto_2.25rem] [content-visibility:auto]"
    >
      {emojis.map((emoji, column) => (
        <div key={emoji.hexcode} role="gridcell">
          <button
            type="button"
            data-row={row}
            data-column={column}
            tabIndex={column === tabColumn ? 0 : -1}
            aria-label={emoji.label}
            title={emoji.label}
            className="flex aspect-square w-full items-center justify-center rounded-md text-xl outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            {withSkinTone(emoji, skinTone)}
          </button>
        </div>
      ))}
    </div>
  )
})

function EmojiPicker({
  onSelect,
  skinTone,
  defaultSkinTone = 0,
  onSkinToneChange,
  className,
  "aria-label": ariaLabel = "Emoji picker",
  ...props
}: Omit<React.ComponentProps<"div">, "onSelect"> & {
  onSelect?: (emoji: string) => void
  skinTone?: SkinTone
  defaultSkinTone?: SkinTone
  onSkinToneChange?: (skinTone: SkinTone) => void
}) {
  const id = React.useId()
  const gridRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const [library, setLibrary] = React.useState<{
    emojis: Emoji[]
    recent: string[]
  } | null>(null)
  const [hasFailed, setHasFailed] = React.useState(false)
  const [storedSkinTone, setStoredSkinTone] = React.useState<SkinTone>()
  const [query, setQuery] = React.useState("")
  const [activeCell, setActiveCell] = React.useState<EmojiCell>({
    row: 0,
    column: 0,
  })
  const { value: tone, setValue: setTone } = useControllableState({
    value: skinTone ?? storedSkinTone,
    defaultValue: defaultSkinTone,
    onChange: (next: SkinTone) => {
      setStoredSkinTone(next)
      writePreferences({ ...readPreferences(), skinTone: next })
      onSkinToneChange?.(next)
    },
  })

  React.useEffect(() => {
    let isCurrent = true
    loadEmojis()
      .then((emojis) => {
        if (!isCurrent) return
        const preferences = readPreferences()
        setLibrary({ emojis, recent: preferences.recent })
        setStoredSkinTone(preferences.skinTone)
      })
      .catch(() => {
        if (isCurrent) setHasFailed(true)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  const needle = query.trim()
  const layout = React.useMemo(() => {
    if (!library) return layoutSections([], COLUMNS)
    const sections = needle
      ? [
          {
            id: "results",
            label: "Search results",
            emojis: searchEmojis(library.emojis, needle),
          },
        ]
      : buildSections(library.emojis, library.recent)
    return layoutSections(sections, COLUMNS)
  }, [library, needle])

  const resultCount = needle ? (layout.sections[0]?.emojis.length ?? 0) : null
  const tabCell = layout.rows[activeCell.row]?.[activeCell.column]
    ? activeCell
    : { row: 0, column: 0 }

  function focusCell(cell: EmojiCell) {
    setActiveCell(cell)
    gridRef.current
      ?.querySelector<HTMLElement>(
        `[data-row="${cell.row}"][data-column="${cell.column}"]`
      )
      ?.focus()
  }

  function pick(emoji: Emoji) {
    const preferences = readPreferences()
    writePreferences({
      ...preferences,
      recent: addRecent(preferences.recent, emoji.hexcode),
    })
    onSelect?.(withSkinTone(emoji, tone))
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
    const next = moveCell(
      layout.rows.map((row) => row.length),
      layout.sections.map((section) => section.firstRow),
      cell,
      event.key,
      event.ctrlKey || event.metaKey
    )
    if (!next) return
    event.preventDefault()
    if (event.key === "ArrowUp" && cell.row === 0) searchRef.current?.focus()
    else focusCell(next)
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      focusCell(tabCell)
    }
    if (event.key === "Enter" && needle && layout.rows[0]) {
      event.preventDefault()
      pick(layout.rows[0][0])
    }
  }

  function scrollToSection(sectionId: string) {
    const grid = gridRef.current
    const section = document.getElementById(`${id}-${sectionId}`)
    if (grid && section) grid.scrollTop = section.offsetTop
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="emoji-picker"
      className={cn(
        "flex h-96 w-80 flex-col gap-2 rounded-lg border bg-popover p-2 text-popover-foreground",
        className
      )}
      {...props}
    >
      <Input
        ref={searchRef}
        type="search"
        aria-label="Search emoji"
        placeholder="Search emoji"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveCell({ row: 0, column: 0 })
          if (gridRef.current) gridRef.current.scrollTop = 0
        }}
        onKeyDown={handleSearchKeyDown}
        className="h-control-sm"
      />
      {!needle && layout.sections.length > 0 && (
        <div aria-hidden className="flex justify-between">
          {layout.sections.map((section) => {
            const Icon = SECTION_ICONS[section.id]
            return (
              <button
                key={section.id}
                type="button"
                tabIndex={-1}
                title={section.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => scrollToSection(section.id)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground [&_svg]:size-4"
              >
                <Icon />
              </button>
            )
          })}
        </div>
      )}
      {layout.rows.length === 0 ? (
        <p className="min-h-0 flex-1 p-2 text-sm text-muted-foreground">
          {hasFailed
            ? "Emoji failed to load"
            : library
              ? "No emoji found"
              : "Loading emoji"}
        </p>
      ) : (
        <div
          ref={gridRef}
          role="grid"
          aria-label="Emoji"
          aria-colcount={COLUMNS}
          onKeyDown={handleGridKeyDown}
          onFocus={(event) => {
            const cell = cellOf(event.target)
            if (cell) setActiveCell(cell)
          }}
          onClick={(event) => {
            const cell = cellOf(event.target)
            if (cell) pick(layout.rows[cell.row][cell.column])
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
                .map((emojis, offset) => {
                  const row = section.firstRow + offset
                  return (
                    <EmojiRow
                      key={row}
                      emojis={emojis}
                      row={row}
                      tabColumn={row === tabCell.row ? tabCell.column : null}
                      skinTone={tone}
                    />
                  )
                })}
            </div>
          ))}
        </div>
      )}
      <fieldset className="flex items-center justify-between">
        <legend className="sr-only">Skin tone</legend>
        {SKIN_TONES.map((option) => (
          <label
            key={option.tone}
            title={`${option.label} skin tone`}
            className="relative flex size-7 cursor-pointer items-center justify-center rounded-md text-base has-checked:bg-accent has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              name={`${id}-skin-tone`}
              className="sr-only"
              checked={tone === option.tone}
              onChange={() => setTone(option.tone)}
            />
            <span aria-hidden>{option.emoji}</span>
            <span className="sr-only">{option.label}</span>
          </label>
        ))}
      </fieldset>
      <span role="status" className="sr-only">
        {resultCount === null
          ? ""
          : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
      </span>
    </div>
  )
}

export { EmojiPicker, type SkinTone }
