"use client"

import * as React from "react"

import { cn } from "@/registry/default/lib/utils"
import {
  MIDNIGHT,
  formatTimeOfDay,
  parseTimeOfDay,
  segmentLabel,
  segmentRange,
  segmentText,
  stepSegment,
  writeSegment,
  readSegment,
  type HourCycle,
  type TimeOfDay,
  type TimeSegment,
} from "@/registry/default/lib/time-segments"
import { useControllableState } from "@/registry/default/hooks/use-controllable-state"

const TYPEAHEAD_RESET_MS = 1000

type TypedDigits = { segment: TimeSegment; digits: string; typedAtMs: number }

function TimeField({
  value,
  defaultValue = "",
  onValueChange,
  hourCycle = 24,
  minuteStep = 1,
  name,
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  hourCycle?: HourCycle
  minuteStep?: number
  name?: string
  disabled?: boolean
}) {
  const { value: timeValue, setValue: setTimeValue } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const segmentRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const typedDigitsRef = React.useRef<TypedDigits | null>(null)
  const time = parseTimeOfDay(timeValue)
  const segments: TimeSegment[] =
    hourCycle === 12 ? ["hour", "minute", "period"] : ["hour", "minute"]

  function commit(next: TimeOfDay) {
    setTimeValue(formatTimeOfDay(next))
  }

  function focusSegment(index: number) {
    segmentRefs.current[index]?.focus()
  }

  function typeDigit(
    segment: TimeSegment,
    index: number,
    digit: string,
    typedAtMs: number
  ) {
    const { min, max } = segmentRange(segment, hourCycle)
    const previous = typedDigitsRef.current
    const isContinuing =
      previous?.segment === segment &&
      typedAtMs - previous.typedAtMs < TYPEAHEAD_RESET_MS
    const combined = isContinuing ? previous.digits + digit : digit
    const digits = Number(combined) > max ? digit : combined
    const typedValue = Number(digits)
    const isComplete = digits.length === 2 || typedValue * 10 > max

    typedDigitsRef.current = isComplete ? null : { segment, digits, typedAtMs }
    if (typedValue >= min)
      commit(writeSegment(time ?? MIDNIGHT, segment, typedValue, hourCycle))
    if (isComplete) focusSegment(index + 1)
  }

  function typePeriod(key: string) {
    const periodIndex = { a: 0, p: 1 }[key.toLowerCase()]
    if (periodIndex === undefined) return
    commit(writeSegment(time ?? MIDNIGHT, "period", periodIndex, hourCycle))
  }

  function handleKeyDown(
    segment: TimeSegment,
    index: number,
    event: React.KeyboardEvent<HTMLSpanElement>
  ) {
    const current = time ?? MIDNIGHT
    const step = segment === "minute" ? minuteStep : 1
    const { min, max } = segmentRange(segment, hourCycle)

    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault()
        commit(
          stepSegment(
            current,
            segment,
            event.key === "ArrowUp" ? step : -step,
            hourCycle
          )
        )
        return
      case "Home":
      case "End":
        event.preventDefault()
        commit(
          writeSegment(
            current,
            segment,
            event.key === "Home" ? min : max,
            hourCycle
          )
        )
        return
      case "ArrowLeft":
      case "ArrowRight":
        event.preventDefault()
        focusSegment(event.key === "ArrowLeft" ? index - 1 : index + 1)
        return
      case "Backspace":
      case "Delete":
        event.preventDefault()
        setTimeValue("")
        return
    }

    if (segment === "period") return typePeriod(event.key)
    if (/^\d$/.test(event.key)) {
      event.preventDefault()
      typeDigit(segment, index, event.key, event.timeStamp)
    }
  }

  return (
    <div
      role="group"
      data-slot="time-field"
      data-disabled={disabled || undefined}
      className={cn(
        "inline-flex h-control w-fit items-center rounded-control border border-input bg-transparent px-2 font-mono text-sm tabular-nums shadow-control transition-[color,box-shadow] dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {segments.map((segment, index) => {
        const { min, max } = segmentRange(segment, hourCycle)
        const text = segmentText(time, segment, hourCycle)

        return (
          <React.Fragment key={segment}>
            {segment === "minute" && (
              <span aria-hidden className="text-muted-foreground">
                :
              </span>
            )}
            <span
              ref={(node) => {
                segmentRefs.current[index] = node
              }}
              role="spinbutton"
              tabIndex={disabled ? -1 : 0}
              data-slot="time-field-segment"
              data-placeholder={time ? undefined : ""}
              aria-label={segmentLabel(segment)}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={
                time ? readSegment(time, segment, hourCycle) : undefined
              }
              aria-valuetext={time ? text : "Empty"}
              onKeyDown={(event) => handleKeyDown(segment, index, event)}
              onBlur={() => {
                typedDigitsRef.current = null
              }}
              className={cn(
                "rounded-sm px-0.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-placeholder:text-muted-foreground",
                segment === "period" && "ml-1"
              )}
            >
              {text}
            </span>
          </React.Fragment>
        )
      })}
      {name && <input type="hidden" name={name} value={timeValue} />}
    </div>
  )
}

export { TimeField }
