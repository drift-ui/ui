"use client"

import * as React from "react"
import { CheckIcon, XIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/registry/default/lib/utils"
import {
  operatorLabel,
  operatorsFor,
  type Filter,
  type FilterField,
  type FilterOperator,
} from "@/registry/default/lib/filter"
import { Calendar } from "@/registry/default/ui/calendar"
import { FilterMenu, FilterMenuItem } from "@/registry/default/ui/filter-menu"
import { Input } from "@/registry/default/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

const segmentClassName =
  "flex items-center gap-1.5 px-2 outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset data-popup-open:bg-accent data-[state=open]:bg-accent [&_svg]:size-3.5"

function ValueLabel({ text }: { text: string }) {
  if (!text) return <span className="text-muted-foreground">Any</span>
  return <span className="max-w-40 truncate font-medium">{text}</span>
}

function formatDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateIso(val?: string): Date | undefined {
  if (!val) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const d = new Date(val)
  return isNaN(d.getTime()) ? undefined : d
}

function formatDateShort(val?: string): string {
  if (!val) return ""
  const d = parseDateIso(val)
  if (!d) return val
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getDisplayValue(field: FilterField, filter: Filter): string {
  if (
    !filter.value ||
    (Array.isArray(filter.value) && filter.value.length === 0)
  ) {
    return ""
  }

  if (field.type === "date") {
    if (filter.operator === "between") {
      const range = Array.isArray(filter.value)
        ? filter.value
        : String(filter.value).split("..")
      const start = formatDateShort(range[0])
      const end = formatDateShort(range[1])
      if (start && end) return `${start} – ${end}`
      if (start) return `${start} – ...`
      return ""
    }
    const val = Array.isArray(filter.value) ? filter.value[0] : filter.value
    return formatDateShort(val)
  }

  if (field.type === "select") {
    const selectedValues = Array.isArray(filter.value)
      ? filter.value
      : String(filter.value)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)

    const labels = selectedValues
      .map(
        (v) => field.options?.find((option) => option.value === v)?.label ?? v
      )
      .filter(Boolean)

    if (labels.length === 0) return ""
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return `${labels[0]}, ${labels[1]}`
    return `${labels[0]} + ${labels.length - 1} more`
  }

  return Array.isArray(filter.value) ? filter.value.join(", ") : filter.value
}

function SingleSelectValueEditor({
  field,
  filter,
  defaultOpen,
  onCommit,
  onDismissEmpty,
}: FilterValueEditorProps) {
  const hasPickedRef = React.useRef(false)
  const val = Array.isArray(filter.value)
    ? (filter.value[0] ?? "")
    : filter.value
  const selected = field.options?.find((option) => option.value === val)

  return (
    <FilterMenu
      defaultOpen={defaultOpen}
      onOpenChange={(open) => {
        if (open || filter.value || hasPickedRef.current) return
        onDismissEmpty()
      }}
      trigger={
        <button type="button" className={segmentClassName}>
          <span className="sr-only">{field.label} value:</span>{" "}
          <ValueLabel text={selected?.label ?? ""} />
        </button>
      }
    >
      {field.options?.map((option) => (
        <FilterMenuItem
          key={option.value}
          isSelected={option.value === val}
          onSelect={() => {
            hasPickedRef.current = true
            onCommit(option.value)
          }}
        >
          {option.label}
        </FilterMenuItem>
      ))}
    </FilterMenu>
  )
}

function MultiSelectValueEditor({
  field,
  filter,
  defaultOpen,
  onCommit,
  onDismissEmpty,
}: FilterValueEditorProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const selectedValues = React.useMemo(() => {
    if (Array.isArray(filter.value)) return filter.value
    return String(filter.value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }, [filter.value])

  function toggleOption(value: string) {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onCommit(next)
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open && selectedValues.length === 0) {
      onDismissEmpty()
    }
  }

  const displayText = getDisplayValue(field, filter)

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={segmentClassName}>
        <span className="sr-only">{field.label} value:</span>{" "}
        <ValueLabel text={displayText} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div
          role="group"
          aria-label={`${field.label} options`}
          className="flex max-h-60 flex-col gap-0.5 overflow-y-auto"
        >
          {field.options?.map((option) => {
            const isSelected = selectedValues.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => toggleOption(option.value)}
                className="relative flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
              >
                <span>{option.label}</span>
                {isSelected && (
                  <CheckIcon className="size-4 shrink-0 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DateValueEditor({
  field,
  filter,
  defaultOpen,
  onCommit,
  onDismissEmpty,
}: FilterValueEditorProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const isBetween = filter.operator === "between"

  const singleDate = React.useMemo(() => {
    if (isBetween) return undefined
    const val = Array.isArray(filter.value) ? filter.value[0] : filter.value
    return parseDateIso(val)
  }, [filter.value, isBetween])

  const dateRange = React.useMemo((): DateRange | undefined => {
    if (!isBetween) return undefined
    const range = Array.isArray(filter.value)
      ? filter.value
      : String(filter.value).split("..")
    const from = parseDateIso(range[0])
    const to = parseDateIso(range[1])
    return { from, to }
  }, [filter.value, isBetween])

  function handleSingleSelect(date?: Date) {
    if (date) {
      onCommit(formatDateIso(date))
      setIsOpen(false)
    }
  }

  function handleRangeSelect(range?: DateRange) {
    if (!range) return
    if (range.from && range.to) {
      onCommit([formatDateIso(range.from), formatDateIso(range.to)])
    } else if (range.from) {
      onCommit([formatDateIso(range.from), formatDateIso(range.from)])
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) {
      const empty =
        !filter.value ||
        (Array.isArray(filter.value) && filter.value.length === 0)
      if (empty) onDismissEmpty()
    }
  }

  const displayText = getDisplayValue(field, filter)

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={segmentClassName}>
        <span className="sr-only">{field.label} value:</span>{" "}
        <ValueLabel text={displayText} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {isBetween ? (
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleRangeSelect}
            autoFocus
          />
        ) : (
          <Calendar
            mode="single"
            defaultMonth={singleDate}
            selected={singleDate}
            onSelect={handleSingleSelect}
            autoFocus
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

function TypedValueEditor({
  field,
  filter,
  defaultOpen,
  onCommit,
  onDismissEmpty,
}: FilterValueEditorProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const stringValue = Array.isArray(filter.value)
    ? filter.value.join(", ")
    : filter.value
  const [draft, setDraft] = React.useState(stringValue)

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open) return setDraft(stringValue)
    if (draft.trim()) return onCommit(draft.trim())
    onDismissEmpty()
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={segmentClassName}>
        <span className="sr-only">{field.label} value:</span>{" "}
        <ValueLabel text={stringValue} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <Input
          autoFocus
          aria-label={`${field.label} value`}
          type={field.type === "number" ? "number" : "text"}
          value={draft}
          placeholder={`Filter by ${field.label.toLowerCase()}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleOpenChange(false)
          }}
          className="h-control-sm py-0"
        />
      </PopoverContent>
    </Popover>
  )
}

type FilterValueEditorProps = {
  field: FilterField
  filter: Filter
  defaultOpen: boolean
  onCommit: (value: string | string[]) => void
  onDismissEmpty: () => void
}

function normalizeValueForOperator(
  nextOperator: FilterOperator,
  currentValue: string | string[]
): string | string[] {
  if (nextOperator === "is-any-of" || nextOperator === "is-none-of") {
    if (Array.isArray(currentValue)) return currentValue
    return currentValue ? [currentValue] : []
  }

  if (nextOperator === "between") {
    if (Array.isArray(currentValue)) {
      if (currentValue.length >= 2) return currentValue.slice(0, 2)
      return [currentValue[0] ?? "", currentValue[0] ?? ""]
    }
    return currentValue ? [currentValue, currentValue] : []
  }

  if (Array.isArray(currentValue)) {
    return currentValue[0] ?? ""
  }

  return currentValue
}

function FilterChip({
  field,
  filter,
  isNew = false,
  onFilterChange,
  onRemove,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  field: FilterField
  filter: Filter
  isNew?: boolean
  onFilterChange: (filter: Filter) => void
  onRemove: () => void
}) {
  let ValueEditor: React.ComponentType<FilterValueEditorProps>
  if (field.type === "date") {
    ValueEditor = DateValueEditor
  } else if (field.type === "select") {
    ValueEditor =
      filter.operator === "is-any-of" || filter.operator === "is-none-of"
        ? MultiSelectValueEditor
        : SingleSelectValueEditor
  } else {
    ValueEditor = TypedValueEditor
  }

  function handleOperatorChange(operator: FilterOperator) {
    const value = normalizeValueForOperator(operator, filter.value)
    onFilterChange({ ...filter, operator, value })
  }

  return (
    <div
      data-slot="filter-chip"
      className={cn(
        "inline-flex h-control-sm items-stretch divide-x overflow-hidden rounded-control border bg-background text-sm shadow-control dark:bg-input/30",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-1.5 px-2 text-muted-foreground [&_svg]:size-3.5">
        {field.icon}
        {field.label}
      </span>
      <FilterMenu
        trigger={
          <button
            type="button"
            className={cn(segmentClassName, "text-muted-foreground")}
          >
            <span className="sr-only">{field.label} operator:</span>{" "}
            {operatorLabel(filter.operator)}
          </button>
        }
      >
        {operatorsFor(field.type).map((operator) => (
          <FilterMenuItem
            key={operator}
            isSelected={operator === filter.operator}
            onSelect={() => handleOperatorChange(operator)}
          >
            {operatorLabel(operator)}
          </FilterMenuItem>
        ))}
      </FilterMenu>
      <ValueEditor
        field={field}
        filter={filter}
        defaultOpen={isNew}
        onCommit={(value) => onFilterChange({ ...filter, value })}
        onDismissEmpty={onRemove}
      />
      <button
        type="button"
        aria-label={`Remove ${field.label} filter`}
        onClick={onRemove}
        className={segmentClassName}
      >
        <XIcon />
      </button>
    </div>
  )
}

export { FilterChip }
