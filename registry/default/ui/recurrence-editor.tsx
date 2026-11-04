"use client"

import * as React from "react"

import { cn } from "@/registry/default/lib/utils"
import {
  describeDays,
  describeRecurrence,
  formatRRule,
  FREQUENCIES,
  isLastWeekOf,
  occurrences,
  ordinalWeekOf,
  parseRRule,
  WEEKDAY_NAMES,
  WEEKDAYS,
  weekdayOf,
  type Frequency,
  type Recurrence,
} from "@/registry/default/lib/recurrence"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { NumberInput } from "@/registry/default/ui/number-input"

type EndMode = "never" | "until" | "count"

const UNIT_LABELS: Record<Frequency, [string, string]> = {
  DAILY: ["day", "days"],
  WEEKLY: ["week", "weeks"],
  MONTHLY: ["month", "months"],
  YEARLY: ["year", "years"],
}
const DEFAULT_COUNT = 10
const DEFAULT_UNTIL_MONTHS = 3
const SELECT_CLASS_NAME =
  "h-9 rounded-md border border-input bg-transparent px-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground"

function subscribeToNothing() {
  return () => {}
}

function endOfDay(year: number, month: number, day: number) {
  return new Date(year, month, day, 23, 59, 59)
}

function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function monthlyChoices(recurrence: Recurrence, start: Date) {
  const weekday = weekdayOf(start)
  const patches: (Pick<Recurrence, "byDay" | "byMonthDay"> & {
    bySetPos?: number[]
  })[] = [{ byDay: [], byMonthDay: [start.getDate()], bySetPos: undefined }]
  if (ordinalWeekOf(start) <= 4) {
    patches.push({
      byDay: [{ weekday, ordinal: ordinalWeekOf(start) }],
      byMonthDay: [],
      bySetPos: undefined,
    })
  }
  if (isLastWeekOf(start)) {
    patches.push({
      byDay: [{ weekday, ordinal: -1 }],
      byMonthDay: [],
      bySetPos: undefined,
    })
  }
  const current = {
    byDay: recurrence.byDay,
    byMonthDay:
      recurrence.byDay.length === 0 &&
      recurrence.byMonthDay.length === 0 &&
      !recurrence.bySetPos
        ? [start.getDate()]
        : recurrence.byMonthDay,
    bySetPos: recurrence.bySetPos,
  }
  const choices = patches.map((patch) => ({
    key: formatRRule({ ...recurrence, ...patch }),
    label: capitalize(describeDays({ ...recurrence, ...patch }, start)),
    patch,
  }))
  const currentKey = formatRRule({ ...recurrence, ...current })
  if (!choices.some((choice) => choice.key === currentKey)) {
    choices.unshift({
      key: currentKey,
      label: capitalize(describeDays(recurrence, start)),
      patch: current,
    })
  }
  return { choices, currentKey }
}

function RecurrenceEditor({
  value,
  defaultValue = "FREQ=WEEKLY",
  onValueChange,
  start,
  showPreview = 0,
  tzid,
  exdates,
  className,
  ...props
}: Omit<React.ComponentProps<"fieldset">, "defaultValue"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (rule: string) => void
  start?: Date
  showPreview?: number
  tzid?: string
  exdates?: (Date | string)[]
}) {
  const id = React.useId()
  const { value: rule, setValue: setRule } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [today] = React.useState(() => new Date())
  const isClient = React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )
  const anchor = start ?? today
  const recurrence = parseRRule(rule)
  const { frequency, interval, count, until } = recurrence
  const endMode: EndMode = count ? "count" : until ? "until" : "never"
  const selectedWeekdays =
    recurrence.byDay.length > 0
      ? recurrence.byDay.map((day) => day.weekday)
      : [weekdayOf(anchor)]
  const monthly = monthlyChoices(recurrence, anchor)
  const upcoming =
    showPreview > 0
      ? occurrences(recurrence, anchor, showPreview, {
          tzid: tzid ?? recurrence.tzid,
          exdates: exdates ?? recurrence.exdates,
        })
      : []
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const isMultiline = rule.includes("\n") || rule.includes("\r")
  const hasPrefix = /^RRULE:/i.test(rule.trim())

  function update(patch: Partial<Recurrence>) {
    setRule(
      formatRRule(
        { ...recurrence, ...patch },
        { multiline: isMultiline, prefix: hasPrefix }
      )
    )
  }

  function changeFrequency(next: Frequency) {
    update({
      frequency: next,
      byDay: next === "WEEKLY" ? [{ weekday: weekdayOf(anchor) }] : [],
      byMonthDay: next === "MONTHLY" ? [anchor.getDate()] : [],
      bySetPos: undefined,
      byMonth: undefined,
    })
  }

  function toggleWeekday(weekday: (typeof WEEKDAYS)[number]) {
    const isSelected = selectedWeekdays.includes(weekday)
    if (isSelected && selectedWeekdays.length === 1) return
    const next = isSelected
      ? selectedWeekdays.filter((day) => day !== weekday)
      : [...selectedWeekdays, weekday]
    update({
      byDay: WEEKDAYS.filter((day) => next.includes(day)).map((day) => ({
        weekday: day,
      })),
    })
  }

  function changeEndMode(mode: EndMode) {
    update({
      count: mode === "count" ? (count ?? DEFAULT_COUNT) : undefined,
      until:
        mode === "until"
          ? (until ??
            endOfDay(
              anchor.getFullYear(),
              anchor.getMonth() + DEFAULT_UNTIL_MONTHS,
              anchor.getDate()
            ))
          : undefined,
    })
  }

  return (
    <fieldset
      data-slot="recurrence-editor"
      className={cn("grid min-w-0 gap-4 text-sm", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={`${id}-interval`}>Repeat every</Label>
        <NumberInput
          id={`${id}-interval`}
          min={1}
          value={interval}
          onValueChange={(next) => {
            if (next !== null) update({ interval: Math.round(next) })
          }}
          className="w-28"
        />
        <select
          aria-label="Frequency"
          value={frequency}
          onChange={(event) => changeFrequency(event.target.value as Frequency)}
          className={SELECT_CLASS_NAME}
        >
          {FREQUENCIES.map((option) => (
            <option key={option} value={option}>
              {UNIT_LABELS[option][interval === 1 ? 0 : 1]}
            </option>
          ))}
        </select>
      </div>

      {frequency === "WEEKLY" && (
        <div
          role="group"
          aria-labelledby={`${id}-weekdays`}
          className="flex flex-wrap items-center gap-2"
        >
          <span id={`${id}-weekdays`} className="mr-1 font-medium">
            Repeat on
          </span>
          {WEEKDAYS.map((weekday) => (
            <button
              key={weekday}
              type="button"
              aria-label={WEEKDAY_NAMES[weekday]}
              aria-pressed={selectedWeekdays.includes(weekday)}
              onClick={() => toggleWeekday(weekday)}
              className="flex size-8 items-center justify-center rounded-full border border-input text-xs font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {WEEKDAY_NAMES[weekday].charAt(0)}
            </button>
          ))}
        </div>
      )}

      {frequency === "MONTHLY" && (
        <select
          aria-label="Day of the month"
          value={monthly.currentKey}
          onChange={(event) => {
            const choice = monthly.choices.find(
              (option) => option.key === event.target.value
            )
            if (choice) update(choice.patch)
          }}
          className={cn(SELECT_CLASS_NAME, "w-fit")}
        >
          {monthly.choices.map((choice) => (
            <option key={choice.key} value={choice.key}>
              {choice.label}
            </option>
          ))}
        </select>
      )}

      <fieldset className="grid gap-2">
        <legend className="mb-2 font-medium">Ends</legend>
        <label className="flex h-9 items-center gap-2">
          <input
            type="radio"
            name={`${id}-end`}
            checked={endMode === "never"}
            onChange={() => changeEndMode("never")}
            className="size-4 accent-primary"
          />
          Never
        </label>
        <div className="flex items-center gap-2">
          <label className="flex w-16 items-center gap-2">
            <input
              type="radio"
              name={`${id}-end`}
              checked={endMode === "until"}
              onChange={() => changeEndMode("until")}
              className="size-4 accent-primary"
            />
            On
          </label>
          <Input
            type="date"
            aria-label="End date"
            disabled={endMode !== "until"}
            value={until ? toDateInputValue(until) : ""}
            min={toDateInputValue(anchor)}
            onChange={(event) => {
              const [year, month, day] = event.target.value
                .split("-")
                .map(Number)
              if (year && month && day) {
                update({ until: endOfDay(year, month - 1, day) })
              }
            }}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex w-16 items-center gap-2">
            <input
              type="radio"
              name={`${id}-end`}
              checked={endMode === "count"}
              onChange={() => changeEndMode("count")}
              className="size-4 accent-primary"
            />
            After
          </label>
          <NumberInput
            aria-label="Occurrences"
            min={1}
            disabled={endMode !== "count"}
            value={count ?? DEFAULT_COUNT}
            onValueChange={(next) => {
              if (next !== null) update({ count: Math.round(next) })
            }}
            className="w-28"
          />
          <span className="text-muted-foreground">
            {count === 1 ? "occurrence" : "occurrences"}
          </span>
        </div>
      </fieldset>

      <p
        data-slot="recurrence-editor-summary"
        aria-live="polite"
        className="font-medium"
      >
        {describeRecurrence(recurrence, anchor)}
      </p>

      {recurrence.unknownParts &&
        Object.keys(recurrence.unknownParts).length > 0 && (
          <p
            data-slot="recurrence-editor-custom-parts"
            className="text-xs text-muted-foreground"
          >
            Preserving custom rules:{" "}
            {Object.keys(recurrence.unknownParts).join(", ")}
          </p>
        )}

      {upcoming.length > 0 && (
        <div className="grid gap-1.5">
          <span id={`${id}-preview`} className="text-muted-foreground">
            Next occurrences
          </span>
          <ol
            aria-labelledby={`${id}-preview`}
            data-slot="recurrence-editor-preview"
            className="grid gap-1 tabular-nums"
          >
            {upcoming.map((date) => (
              <li key={date.getTime()} className="min-h-5">
                {isClient && dateFormatter.format(date)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </fieldset>
  )
}

export { RecurrenceEditor }
