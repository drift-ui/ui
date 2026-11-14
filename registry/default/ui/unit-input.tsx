"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  BYTE_UNITS,
  bestUnit,
  clampValue,
  formatAmount,
  fromBase,
  parseUnitText,
  toBase,
  type Unit,
} from "@/registry/default/lib/unit-input-utils"
import { cn } from "@/registry/default/lib/utils"

const LARGE_STEP_MULTIPLIER = 10

interface UnitInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "type" | "min" | "max" | "step" | "onChange"
> {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  units?: Unit[]
  unit?: string
  defaultUnit?: string
  onUnitChange?: (unit: string) => void
  min?: number
  max?: number
  step?: number
}

function UnitInput({
  value,
  defaultValue = null,
  onValueChange,
  units = BYTE_UNITS,
  unit,
  defaultUnit,
  onUnitChange,
  min,
  max,
  step = 1,
  name,
  disabled,
  className,
  onBlur,
  onKeyDown,
  ...props
}: UnitInputProps) {
  const { value: currentValue, setValue } = useControllableState<number | null>(
    { value, defaultValue, onChange: onValueChange }
  )
  const { value: unitId, setValue: setUnitId } = useControllableState<string>({
    value: unit,
    defaultValue: defaultUnit ?? bestUnit(value ?? defaultValue, units).id,
    onChange: onUnitChange,
  })
  const [draft, setDraft] = React.useState<string | null>(null)

  const activeUnit =
    units.find((candidate) => candidate.id === unitId) ??
    bestUnit(currentValue, units)
  const amount =
    currentValue === null ? null : fromBase(currentValue, activeUnit)
  const displayedText = draft ?? (amount === null ? "" : formatAmount(amount))

  function commit(next: number | null) {
    setDraft(null)
    setValue(next === null ? null : clampValue(next, min, max))
  }

  function commitDraft() {
    if (draft === null) return
    if (draft.trim() === "") return commit(null)

    const parsed = parseUnitText(draft, units)
    if (!parsed) return setDraft(null)

    const targetUnit = parsed.unit ?? activeUnit
    if (parsed.unit) setUnitId(parsed.unit.id)
    commit(toBase(parsed.amount, targetUnit))
  }

  function stepBy(delta: number) {
    const parsed = draft === null ? null : parseUnitText(draft, units)
    const targetUnit = parsed?.unit ?? activeUnit
    if (parsed?.unit) setUnitId(parsed.unit.id)
    const base =
      parsed?.amount ??
      amount ??
      (min === undefined ? 0 : fromBase(min, activeUnit))
    commit(toBase(base + delta, targetUnit))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented || props.readOnly) return

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
        commitDraft()
        return
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div
      data-slot="unit-input"
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "flex h-control w-full min-w-0 items-stretch overflow-hidden rounded-control border border-input bg-transparent shadow-control transition-[color,box-shadow] dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        role="spinbutton"
        aria-valuenow={amount ?? undefined}
        aria-valuetext={
          amount === null
            ? undefined
            : `${formatAmount(amount)} ${activeUnit.label}`
        }
        aria-valuemin={
          min === undefined ? undefined : fromBase(min, activeUnit)
        }
        aria-valuemax={
          max === undefined ? undefined : fromBase(max, activeUnit)
        }
        disabled={disabled}
        value={displayedText}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          onBlur?.(event)
          commitDraft()
        }}
        onKeyDown={handleKeyDown}
        className="w-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm"
        {...props}
      />
      <select
        aria-label="Unit"
        data-slot="unit-input-select"
        disabled={disabled}
        value={activeUnit.id}
        onChange={(event) => setUnitId(event.target.value)}
        className="shrink-0 cursor-pointer border-l border-input bg-transparent px-2 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground [&>option]:bg-popover [&>option]:text-popover-foreground"
      >
        {units.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {name && (
        <input
          type="hidden"
          name={name}
          disabled={disabled}
          value={currentValue ?? ""}
        />
      )}
    </div>
  )
}

export { UnitInput, type UnitInputProps }
