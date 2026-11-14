"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  type DurationUnit,
  parseDurationString,
  readSegment,
  roundToSmallestUnit,
  segmentRange,
  segmentText,
  sortUnits,
  stepSegment,
  unitCountText,
  unitLabel,
  writeSegment,
} from "@/registry/default/lib/duration-input-utils"
import { cn } from "@/registry/default/lib/utils"

const TYPEAHEAD_RESET_MS = 1000

const DEFAULT_UNITS: DurationUnit[] = ["h", "m", "s"]

type TypedDigits = {
  unit: DurationUnit
  digits: string
  typedAtMs: number
}

type DigitEntry = {
  base: number | null
  draft: number
  digits: string
  typedAtMs: number
}

interface DurationInputProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  units?: DurationUnit[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  name?: string
}

function DurationInput({
  value,
  defaultValue = null,
  onValueChange,
  units = DEFAULT_UNITS,
  min = 0,
  max,
  step = 1,
  disabled,
  name,
  className,
  ...props
}: DurationInputProps) {
  const { value: durationValue, setValue: setDurationValue } =
    useControllableState<number | null>({
      value,
      defaultValue,
      onChange: onValueChange,
    })

  const orderedUnits = React.useMemo(() => sortUnits(units), [units])
  const segmentRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const typedDigitsRef = React.useRef<TypedDigits | null>(null)
  const digitEntryRef = React.useRef<DigitEntry | null>(null)

  function commit(next: number | null) {
    if (next === null) {
      setDurationValue(null)
      return
    }
    const clamped = Math.min(max ?? Infinity, Math.max(min, next))
    setDurationValue(clamped)
  }

  function focusSegment(index: number) {
    if (index >= 0 && index < orderedUnits.length) {
      segmentRefs.current[index]?.focus()
    }
  }

  function focusUnit(targetUnit: DurationUnit) {
    const index = orderedUnits.indexOf(targetUnit)
    if (index !== -1) {
      focusSegment(index)
    }
  }

  function typeDigit(
    unit: DurationUnit,
    index: number,
    digit: string,
    typedAtMs: number
  ) {
    const previous = typedDigitsRef.current
    const isContinuing =
      previous?.unit === unit &&
      typedAtMs - previous.typedAtMs < TYPEAHEAD_RESET_MS
    const combined = isContinuing ? previous.digits + digit : digit
    const maxDigits = unit === "ms" ? 3 : 2
    const isComplete = combined.length >= maxDigits

    typedDigitsRef.current = isComplete
      ? null
      : { unit, digits: combined, typedAtMs }

    const entry = digitEntryRef.current
    const isEntryContinuing =
      entry !== null && typedAtMs - entry.typedAtMs < TYPEAHEAD_RESET_MS
    const draft = writeSegment(
      isEntryContinuing ? entry.draft : durationValue,
      unit,
      Number(combined),
      orderedUnits
    )
    digitEntryRef.current = {
      base: isEntryContinuing ? entry.base : durationValue,
      draft,
      digits: (isEntryContinuing ? entry.digits : "") + digit,
      typedAtMs,
    }

    commit(draft)

    if (isComplete) {
      focusSegment(index + 1)
    }
  }

  function assignDigitsToUnit(targetUnit: DurationUnit, pressedAtMs: number) {
    const entry = digitEntryRef.current
    typedDigitsRef.current = null
    digitEntryRef.current = null

    if (entry && pressedAtMs - entry.typedAtMs < TYPEAHEAD_RESET_MS) {
      commit(
        writeSegment(entry.base, targetUnit, Number(entry.digits), orderedUnits)
      )
    }
    focusUnit(targetUnit)
  }

  function handleKeyDown(
    unit: DurationUnit,
    index: number,
    event: React.KeyboardEvent<HTMLSpanElement>
  ) {
    if (disabled || event.metaKey || event.ctrlKey || event.altKey) return

    if (event.key.length > 1 && event.key !== "Shift") {
      digitEntryRef.current = null
    }

    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown": {
        event.preventDefault()
        const delta = event.key === "ArrowUp" ? step : -step
        commit(stepSegment(durationValue, unit, delta, orderedUnits, max, min))
        return
      }
      case "PageUp":
      case "PageDown": {
        event.preventDefault()
        const delta = event.key === "PageUp" ? step * 10 : -step * 10
        commit(stepSegment(durationValue, unit, delta, orderedUnits, max, min))
        return
      }
      case "Home": {
        event.preventDefault()
        commit(writeSegment(durationValue, unit, 0, orderedUnits, max, min))
        return
      }
      case "End": {
        event.preventDefault()
        const { max: segMax } = segmentRange(
          unit,
          orderedUnits,
          max,
          min,
          durationValue
        )
        commit(
          writeSegment(durationValue, unit, segMax, orderedUnits, max, min)
        )
        return
      }
      case "ArrowLeft":
      case "ArrowRight": {
        event.preventDefault()
        focusSegment(event.key === "ArrowLeft" ? index - 1 : index + 1)
        return
      }
      case "Backspace":
      case "Delete": {
        event.preventDefault()
        if (typedDigitsRef.current) {
          typedDigitsRef.current = null
          commit(writeSegment(durationValue, unit, 0, orderedUnits, max, min))
        } else {
          commit(null)
        }
        return
      }
    }

    const keyLower = event.key.toLowerCase() as DurationUnit
    if (orderedUnits.includes(keyLower)) {
      event.preventDefault()
      assignDigitsToUnit(keyLower, event.timeStamp)
      return
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault()
      typeDigit(unit, index, event.key, event.timeStamp)
    }
  }

  function handlePaste(
    unit: DurationUnit,
    event: React.ClipboardEvent<HTMLSpanElement>
  ) {
    if (disabled) return
    const text = event.clipboardData.getData("text")
    const parsed = parseDurationString(text, unit)
    if (parsed !== null) {
      event.preventDefault()
      typedDigitsRef.current = null
      digitEntryRef.current = null
      commit(roundToSmallestUnit(parsed, orderedUnits))
    }
  }

  return (
    <div
      role="group"
      data-slot="duration-input"
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "inline-flex h-control w-fit items-center rounded-control border border-input bg-transparent px-2 font-mono text-sm tabular-nums shadow-control transition-[color,box-shadow] dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {orderedUnits.map((unit, index) => {
        const { min: segMin, max: segMax } = segmentRange(
          unit,
          orderedUnits,
          max,
          min,
          durationValue
        )
        const text = segmentText(durationValue, unit, orderedUnits)
        const currentVal =
          durationValue !== null && durationValue !== undefined
            ? readSegment(durationValue, unit, orderedUnits)
            : undefined

        return (
          <React.Fragment key={unit}>
            <span
              ref={(node) => {
                segmentRefs.current[index] = node
              }}
              role="spinbutton"
              tabIndex={disabled ? -1 : 0}
              data-slot="duration-input-segment"
              data-placeholder={durationValue === null ? "" : undefined}
              aria-label={unitLabel(unit)}
              aria-valuemin={segMin}
              aria-valuemax={segMax}
              aria-valuenow={currentVal}
              aria-valuetext={
                durationValue !== null
                  ? unitCountText(currentVal ?? 0, unit)
                  : "Empty"
              }
              onKeyDown={(event) => handleKeyDown(unit, index, event)}
              onPaste={(event) => handlePaste(unit, event)}
              onBlur={(event) => {
                typedDigitsRef.current = null
                const nextFocus = event.relatedTarget as HTMLSpanElement | null
                if (!segmentRefs.current.includes(nextFocus)) {
                  digitEntryRef.current = null
                }
              }}
              className="rounded-sm px-0.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-placeholder:text-muted-foreground"
            >
              {text}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "text-muted-foreground select-none",
                index < orderedUnits.length - 1 && "mr-1.5"
              )}
            >
              {unit}
            </span>
          </React.Fragment>
        )
      })}
      {name && (
        <input
          type="hidden"
          name={name}
          disabled={disabled}
          value={
            durationValue !== null && durationValue !== undefined
              ? durationValue
              : ""
          }
        />
      )}
    </div>
  )
}

export { DurationInput, type DurationInputProps }
