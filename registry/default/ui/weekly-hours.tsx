"use client"

import * as React from "react"
import { CopyIcon, PlusIcon, XIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import type { HourCycle } from "@/registry/default/lib/time-segments"
import { cn } from "@/registry/default/lib/utils"
import {
  addRange,
  copyDayToAvailableDays,
  getDayRanges,
  getNextRange,
  getRangeError,
  removeRange,
  setDayAvailable,
  updateRange,
  WEEKDAY_NAMES,
  WEEKDAYS,
  type TimeRange,
  type Weekday,
  type WeeklyHoursRange,
} from "@/registry/default/lib/weekly-hours-utils"
import { Button } from "@/registry/default/ui/button"
import { TimeField } from "@/registry/default/ui/time-field"

const EMPTY: WeeklyHoursRange[] = []
const NINE_TO_FIVE: TimeRange = { start: "09:00", end: "17:00" }

export type WeeklyHoursProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  value?: WeeklyHoursRange[]
  defaultValue?: WeeklyHoursRange[]
  onValueChange?: (value: WeeklyHoursRange[]) => void
  weekdays?: Weekday[]
  defaultRange?: TimeRange
  hourCycle?: HourCycle
  minuteStep?: number
  disabled?: boolean
  unavailableLabel?: string
}

function WeeklyHours({
  value,
  defaultValue = EMPTY,
  onValueChange,
  weekdays = WEEKDAYS,
  defaultRange = NINE_TO_FIVE,
  hourCycle = 24,
  minuteStep = 15,
  disabled = false,
  unavailableLabel = "Unavailable",
  className,
  ...props
}: WeeklyHoursProps) {
  const { value: ranges = EMPTY, setValue: setRanges } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const id = React.useId()

  return (
    <div
      data-slot="weekly-hours"
      className={cn("grid divide-y", className)}
      {...props}
    >
      {weekdays.map((day) => {
        const dayName = WEEKDAY_NAMES[day]
        const dayRanges = getDayRanges(ranges, day)
        const isAvailable = dayRanges.length > 0
        const canAdd = getNextRange(dayRanges, defaultRange) !== null
        const checkboxId = `${id}-${day}`

        return (
          <div
            key={day}
            data-slot="weekly-hours-day"
            data-available={isAvailable || undefined}
            className="flex flex-wrap items-start gap-x-4 gap-y-2 py-3"
          >
            <label
              htmlFor={checkboxId}
              className="flex h-control w-28 shrink-0 items-center gap-2.5 text-sm font-medium"
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={isAvailable}
                disabled={disabled}
                onChange={(event) =>
                  setRanges(
                    setDayAvailable(
                      ranges,
                      day,
                      event.target.checked,
                      defaultRange
                    )
                  )
                }
                className="size-4 accent-primary"
              />
              {dayName}
            </label>

            <div className="grid min-w-0 flex-1 gap-2">
              {isAvailable ? (
                dayRanges.map((range, index) => {
                  const error = getRangeError(dayRanges, index)
                  const errorId = `${checkboxId}-${index}-error`
                  const label =
                    dayRanges.length > 1
                      ? `${dayName}, range ${index + 1}`
                      : dayName
                  return (
                    <div
                      key={index}
                      data-slot="weekly-hours-range"
                      className="grid gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <TimeField
                          aria-label={`${label} start`}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          value={range.start}
                          onValueChange={(start) =>
                            setRanges(
                              updateRange(ranges, day, index, { start })
                            )
                          }
                          hourCycle={hourCycle}
                          minuteStep={minuteStep}
                          disabled={disabled}
                        />
                        <span aria-hidden className="text-muted-foreground">
                          –
                        </span>
                        <TimeField
                          aria-label={`${label} end`}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          value={range.end}
                          onValueChange={(end) =>
                            setRanges(updateRange(ranges, day, index, { end }))
                          }
                          hourCycle={hourCycle}
                          minuteStep={minuteStep}
                          disabled={disabled}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${label}`}
                          disabled={disabled}
                          onClick={() =>
                            setRanges(removeRange(ranges, day, index))
                          }
                        >
                          <XIcon />
                        </Button>
                      </div>
                      {error && (
                        <p id={errorId} className="text-xs text-destructive">
                          {error}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="flex h-control items-center text-sm text-muted-foreground">
                  {unavailableLabel}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Add hours on ${dayName}`}
                title="Add hours"
                disabled={disabled || !canAdd}
                onClick={() => setRanges(addRange(ranges, day, defaultRange))}
              >
                <PlusIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Copy ${dayName} hours to every available day`}
                title="Copy to every available day"
                disabled={disabled || !isAvailable}
                onClick={() =>
                  setRanges(copyDayToAvailableDays(ranges, day, weekdays))
                }
              >
                <CopyIcon />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { WeeklyHours }
export type { TimeRange, Weekday, WeeklyHoursRange }
