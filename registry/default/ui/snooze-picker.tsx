"use client"

import * as React from "react"
import { ArrowLeftIcon, CalendarIcon, CheckIcon, ClockIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  DEFAULT_SNOOZE_PRESETS,
  combineDateAndTime,
  formatPresetTime,
  getZonedDateTimeParts,
  resolvePreset,
  resolvePresets,
  type ResolvedPreset,
  type SnoozePreset,
  type SnoozeTimes,
} from "@/registry/default/lib/snooze-picker-utils"
import { cn } from "@/registry/default/lib/utils"
import { Button, buttonVariants } from "@/registry/default/ui/button"
import { Calendar } from "@/registry/default/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { TimeField } from "@/registry/default/ui/time-field"

function getTimeString(date: Date, timeZone?: string): string {
  const parts = getZonedDateTimeParts(date, timeZone)
  const h = String(parts.hour).padStart(2, "0")
  const m = String(parts.minute).padStart(2, "0")
  return `${h}:${m}`
}

export type SnoozePickerProps = Omit<
  React.ComponentProps<"button">,
  "value" | "defaultValue" | "children"
> & {
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (value: Date | null) => void
  onSelect?: (date: Date, presetId?: string) => void
  presets?: SnoozePreset[]
  times?: SnoozeTimes
  timeZone?: string
  locale?: string
  hourCycle?: 12 | 24
  min?: Date
  max?: Date
  now?: Date
  placeholder?: string
  children?: React.ReactNode
  name?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}

function SnoozePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  onSelect,
  presets = DEFAULT_SNOOZE_PRESETS,
  times,
  timeZone,
  locale = "en-US",
  hourCycle = 24,
  min,
  max,
  now: pinnedNow,
  placeholder = "Snooze",
  children,
  name,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "start",
  variant = "outline",
  size = "default",
  disabled,
  className,
  ...props
}: SnoozePickerProps) {
  const menuId = React.useId()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const { value, setValue } = useControllableState<Date | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })

  const { value: isOpen, setValue: setIsOpen } = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  const [view, setView] = React.useState<"presets" | "custom">("presets")
  const [openedAt, setOpenedAt] = React.useState<Date>(
    () => pinnedNow ?? new Date()
  )

  const effectiveNow = pinnedNow ?? openedAt

  const resolvedPresets = React.useMemo(
    () =>
      resolvePresets(presets, effectiveNow, {
        timeZone,
        times,
        locale,
        hourCycle,
      }),
    [presets, effectiveNow, timeZone, times, locale, hourCycle]
  )

  const defaultNextDate = React.useMemo(() => {
    if (value) return value
    const tomorrow = resolvePreset("tomorrow", effectiveNow, {
      timeZone,
      times,
    })
    return tomorrow?.date ?? effectiveNow
  }, [value, effectiveNow, timeZone, times])

  const [customDate, setCustomDate] = React.useState<Date>(defaultNextDate)
  const [customTime, setCustomTime] = React.useState<string>(() =>
    value ? getTimeString(value, timeZone) : (times?.morning ?? "09:00")
  )

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen)
    if (nextOpen) {
      const nowTs = pinnedNow ?? new Date()
      setOpenedAt(nowTs)
      setView("presets")
      const nextDate =
        value ??
        resolvePreset("tomorrow", nowTs, { timeZone, times })?.date ??
        nowTs
      setCustomDate(nextDate)
      setCustomTime(
        value ? getTimeString(value, timeZone) : (times?.morning ?? "09:00")
      )
    } else {
      setView("presets")
    }
  }

  function handleSelectPreset(preset: ResolvedPreset) {
    setValue(preset.date)
    onSelect?.(preset.date, preset.id)
    setIsOpen(false)
  }

  function handleCustomSubmit() {
    if (!customDate) return
    const finalDate = combineDateAndTime(customDate, customTime, timeZone)
    setValue(finalDate)
    onSelect?.(finalDate, "custom")
    setIsOpen(false)
  }

  function handlePresetKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not([disabled])'
    )
    if (!items || items.length === 0) return

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault()
        const nextIndex = (index + 1) % items.length
        items[nextIndex]?.focus()
        break
      }
      case "ArrowUp": {
        e.preventDefault()
        const prevIndex = (index - 1 + items.length) % items.length
        items[prevIndex]?.focus()
        break
      }
      case "Home": {
        e.preventDefault()
        items[0]?.focus()
        break
      }
      case "End": {
        e.preventDefault()
        items[items.length - 1]?.focus()
        break
      }
      case "ArrowRight": {
        if (index === items.length - 1) {
          e.preventDefault()
          setView("custom")
        }
        break
      }
      case "Escape": {
        e.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
        break
      }
    }
  }

  // Auto-focus first item when presets view opens
  React.useEffect(() => {
    if (isOpen && view === "presets") {
      const timer = setTimeout(() => {
        const firstItem = menuRef.current?.querySelector<HTMLButtonElement>(
          '[role="menuitem"]:not([disabled])'
        )
        firstItem?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, view])

  const displayLabel = React.useMemo(() => {
    if (value) {
      return formatPresetTime(value, effectiveNow, {
        timeZone,
        locale,
        hourCycle,
      })
    }
    return placeholder
  }, [value, effectiveNow, timeZone, locale, hourCycle, placeholder])

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          ref={triggerRef}
          type="button"
          role="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          disabled={disabled}
          data-slot="snooze-picker-trigger"
          data-empty={!value || undefined}
          className={cn(
            buttonVariants({ variant, size }),
            size !== "icon" && "h-control justify-start text-left font-normal",
            !value && size !== "icon" && "text-muted-foreground",
            className
          )}
          {...props}
        >
          {children ?? (
            <>
              <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
              {size === "icon" ? (
                <span className="sr-only">{displayLabel}</span>
              ) : (
                <span className="truncate">{displayLabel}</span>
              )}
            </>
          )}
        </PopoverTrigger>

        <PopoverContent
          align={align}
          side={side}
          className={cn(
            "transition-all duration-150 outline-none",
            view === "presets" ? "w-64 p-1" : "w-auto p-3"
          )}
        >
          {view === "presets" ? (
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-orientation="vertical"
              aria-label="Snooze options"
              className="space-y-0.5 text-xs outline-none"
            >
              {resolvedPresets.map((preset, index) => {
                const isSelected =
                  value &&
                  Math.abs(value.getTime() - preset.date.getTime()) < 60000

                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="menuitem"
                    data-preset={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    onKeyDown={(e) => handlePresetKeyDown(e, index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors outline-none select-none",
                      "cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {isSelected && (
                        <CheckIcon className="size-3.5 shrink-0 text-primary" />
                      )}
                      <span>{preset.label}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {preset.timeLabel}
                    </span>
                  </button>
                )
              })}

              <div role="separator" className="my-1 h-px bg-border" />

              <button
                type="button"
                role="menuitem"
                data-preset="custom"
                onClick={() => setView("custom")}
                onKeyDown={(e) =>
                  handlePresetKeyDown(e, resolvedPresets.length)
                }
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors outline-none select-none",
                  "cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                )}
              >
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                <span className="flex-1 font-medium">
                  Pick date and time...
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setView("presets")}
                  aria-label="Back to presets"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <span className="text-xs font-semibold">
                  Pick date and time
                </span>
              </div>

              <Calendar
                mode="single"
                selected={customDate}
                onSelect={(d) => {
                  if (d) setCustomDate(d)
                }}
                disabled={(date) => {
                  if (min) {
                    const minDay = new Date(
                      min.getFullYear(),
                      min.getMonth(),
                      min.getDate()
                    )
                    const curDay = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate()
                    )
                    if (curDay < minDay) return true
                  }
                  if (max) {
                    const maxDay = new Date(
                      max.getFullYear(),
                      max.getMonth(),
                      max.getDate()
                    )
                    const curDay = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate()
                    )
                    if (curDay > maxDay) return true
                  }
                  return false
                }}
                className="p-0"
              />

              <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Time
                </span>
                <TimeField
                  value={customTime}
                  onValueChange={setCustomTime}
                  hourCycle={hourCycle}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setView("presets")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!customDate}
                  onClick={handleCustomSubmit}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ? value.toISOString() : ""}
        />
      )}
    </>
  )
}

export { SnoozePicker }
