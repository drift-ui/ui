"use client"

import * as React from "react"
import { AlertCircle, Calendar, Clock } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  describeCron,
  getNextRunTimes,
  parseCron,
} from "@/registry/default/lib/cron-input.ts"
import { cn } from "@/registry/default/lib/utils"

export interface CronInputProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  showDescription?: boolean
  showNextRuns?: boolean
  nextRunsCount?: number
  nextRunsFrom?: Date
  formatNextRun?: (date: Date) => string
  inputProps?: Omit<
    React.ComponentProps<"input">,
    "value" | "defaultValue" | "onChange" | "disabled" | "readOnly"
  >
}

function defaultFormatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weekday = weekdays[date.getDay()]

  return `${weekday}, ${year}-${month}-${day} ${hours}:${minutes}`
}

function CronInput({
  value,
  defaultValue = "* * * * *",
  onValueChange,
  placeholder = "* * * * *",
  disabled = false,
  readOnly = false,
  showDescription = true,
  showNextRuns = true,
  nextRunsCount = 5,
  nextRunsFrom,
  formatNextRun,
  inputProps,
  className,
  ...props
}: CronInputProps) {
  const { value: currentValue, setValue } = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  })

  const generatedId = React.useId()
  const inputId = inputProps?.id ?? `cron-input-${generatedId}`
  const errorId = `cron-error-${generatedId}`
  const descId = `cron-desc-${generatedId}`

  const parsed = React.useMemo(() => parseCron(currentValue), [currentValue])
  const description = React.useMemo(
    () => describeCron(currentValue),
    [currentValue]
  )

  const nextRuns = React.useMemo(() => {
    if (!parsed.isValid || !showNextRuns) return []
    return getNextRunTimes(currentValue, nextRunsCount, nextRunsFrom)
  }, [parsed.isValid, showNextRuns, currentValue, nextRunsCount, nextRunsFrom])

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    },
    [setValue]
  )

  const isInvalid = !parsed.isValid

  return (
    <div
      data-slot="cron-input"
      className={cn("flex w-full flex-col gap-2 text-sm", className)}
      {...props}
    >
      <div className="relative flex w-full flex-col gap-1.5">
        <input
          {...inputProps}
          id={inputId}
          data-slot="cron-input-field"
          type="text"
          value={currentValue ?? ""}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={isInvalid ? "true" : undefined}
          aria-describedby={
            isInvalid
              ? errorId
              : showDescription && description
                ? descId
                : undefined
          }
          className={cn(
            "h-control w-full min-w-0 rounded-control border border-input bg-transparent px-3 py-1 font-mono text-base shadow-control transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isInvalid &&
              "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
            inputProps?.className
          )}
        />

        {isInvalid ? (
          <div
            id={errorId}
            data-slot="cron-input-error"
            role="alert"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{parsed.error}</span>
          </div>
        ) : showDescription && description ? (
          <div
            id={descId}
            data-slot="cron-input-description"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Clock
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{description}</span>
          </div>
        ) : null}
      </div>

      {!isInvalid && showNextRuns && nextRuns.length > 0 && (
        <div
          data-slot="cron-input-next-runs"
          className={cn(
            "rounded-control border border-border bg-muted/40 p-3 text-xs text-muted-foreground",
            disabled && "opacity-50"
          )}
        >
          <div
            data-slot="cron-input-next-runs-header"
            className="mb-2 flex items-center gap-1.5 font-medium text-foreground"
          >
            <Calendar
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>Upcoming {nextRuns.length} runs</span>
          </div>
          <ol data-slot="cron-input-runs-list" className="space-y-1 font-mono">
            {nextRuns.map((run, index) => (
              <li key={index} data-slot="cron-input-run-item">
                {formatNextRun ? formatNextRun(run) : defaultFormatDate(run)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

export { CronInput }
