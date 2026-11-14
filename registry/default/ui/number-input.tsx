"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"

const LARGE_STEP_MULTIPLIER = 10

function decimalPlaces(step: number) {
  const [, fraction = ""] = String(step).split(".")
  return fraction.length
}

function clampToRange(value: number, min?: number, max?: number) {
  return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value))
}

function separatorsFor(locale?: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  return {
    group: parts.find((part) => part.type === "group")?.value ?? ",",
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
  }
}

function parseLocalizedNumber(
  text: string,
  locale?: string,
  formatOptions?: Intl.NumberFormatOptions
) {
  const { group, decimal } = separatorsFor(locale)
  const normalized = text
    .split(group)
    .join("")
    .replace(decimal, ".")
    .replace(/[^\d.-]/g, "")
  if (normalized === "" || normalized === "-") return null

  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) return null

  return formatOptions?.style === "percent" ? parsed / 100 : parsed
}

function NumberInput({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  locale,
  formatOptions,
  name,
  disabled,
  className,
  onBlur,
  onKeyDown,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "type" | "min" | "max" | "step" | "onChange"
> & {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  locale?: string
  formatOptions?: Intl.NumberFormatOptions
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [draft, setDraft] = React.useState<string | null>(null)
  const currentValue = value !== undefined ? value : uncontrolledValue
  const formatter = new Intl.NumberFormat(locale, formatOptions)
  const displayedText =
    draft ?? (currentValue === null ? "" : formatter.format(currentValue))
  const canDecrement =
    currentValue === null || currentValue > (min ?? -Infinity)
  const canIncrement = currentValue === null || currentValue < (max ?? Infinity)

  function commit(next: number | null) {
    const settled = next === null ? null : clampToRange(next, min, max)
    setDraft(null)
    if (value === undefined) setUncontrolledValue(settled)
    if (settled !== currentValue) onValueChange?.(settled)
  }

  function committedOrDraftValue() {
    if (draft === null) return currentValue
    return parseLocalizedNumber(draft, locale, formatOptions)
  }

  function stepBy(amount: number) {
    const base = committedOrDraftValue() ?? min ?? 0
    const precision = Math.max(decimalPlaces(base), decimalPlaces(step))
    commit(Number((base + amount).toFixed(precision)))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const largeStep = step * LARGE_STEP_MULTIPLIER
    const stepAmount = event.shiftKey ? largeStep : step

    switch (event.key) {
      case "ArrowUp":
        stepBy(stepAmount)
        break
      case "ArrowDown":
        stepBy(-stepAmount)
        break
      case "PageUp":
        stepBy(largeStep)
        break
      case "PageDown":
        stepBy(-largeStep)
        break
      case "Home":
        if (min === undefined) return
        commit(min)
        break
      case "End":
        if (max === undefined) return
        commit(max)
        break
      case "Enter":
        commit(committedOrDraftValue())
        return
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div
      data-slot="number-input"
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "flex h-control w-full min-w-0 items-stretch overflow-hidden rounded-control border border-input bg-transparent shadow-control transition-[color,box-shadow] dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <StepButton
        label="Decrease"
        disabled={disabled || !canDecrement}
        onStep={() => stepBy(-step)}
      >
        <MinusIcon />
      </StepButton>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        role="spinbutton"
        aria-valuenow={currentValue ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        disabled={disabled}
        value={displayedText}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          onBlur?.(event)
          if (draft !== null) commit(committedOrDraftValue())
        }}
        onKeyDown={handleKeyDown}
        className="w-full min-w-0 flex-1 border-x border-input bg-transparent px-2 text-center text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm"
        {...props}
      />
      <StepButton
        label="Increase"
        disabled={disabled || !canIncrement}
        onStep={() => stepBy(step)}
      >
        <PlusIcon />
      </StepButton>
      {name && <input type="hidden" name={name} value={currentValue ?? ""} />}
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onStep,
  children,
}: {
  label: string
  disabled?: boolean
  onStep: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onStep}
      className="flex w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5"
    >
      {children}
    </button>
  )
}

export { NumberInput }
