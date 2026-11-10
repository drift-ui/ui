"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  applyMask,
  calculateCurrencyCaretPosition,
  calculateMaskCaretPosition,
  DEFAULT_MASK_DEFINITIONS,
  deleteCurrencyDigitPastFormatting,
  deleteTokenPastFormatting,
  formatCurrency,
  formatCurrencyLive,
  parseCurrency,
  unmaskValue,
} from "@/registry/default/lib/masked-input.ts"
import { cn } from "@/registry/default/lib/utils"

interface MaskedInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> {
  mask: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, formattedValue: string) => void
  definitions?: Record<string, RegExp>
}

function MaskedInput({
  mask,
  value,
  defaultValue = "",
  onValueChange,
  definitions = DEFAULT_MASK_DEFINITIONS,
  name,
  disabled,
  className,
  ref,
  ...props
}: MaskedInputProps) {
  const { value: rawValue, setValue: setRawValue } = useControllableState({
    value,
    defaultValue,
    onChange: (val) => {
      const { formatted } = applyMask(val, mask, definitions)
      onValueChange?.(val, formatted)
    },
  })

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const [edit, setEdit] = React.useState<{
    text: string
    caret: number
  } | null>(null)

  const formattedValue = React.useMemo(
    () => applyMask(rawValue ?? "", mask, definitions).formatted,
    [rawValue, mask, definitions]
  )

  const display =
    edit !== null &&
    unmaskValue(edit.text, mask, definitions) === (rawValue ?? "")
      ? edit.text
      : formattedValue

  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (input && document.activeElement === input && edit !== null) {
      input.setSelectionRange(edit.caret, edit.caret)
    }
  }, [edit])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value: rawInput, selectionStart } = event.target
    const { inputType } = (event.nativeEvent as InputEvent) || {}
    const isForward = inputType === "deleteContentForward"

    const { text, caret } = deleteTokenPastFormatting(
      display,
      rawInput,
      selectionStart ?? rawInput.length,
      isForward,
      mask,
      definitions
    )

    const unmasked = unmaskValue(text, mask, definitions)
    const { formatted: nextFormatted, raw: nextRaw } = applyMask(
      unmasked,
      mask,
      definitions
    )

    const nextCursor = calculateMaskCaretPosition({
      nextFormatted,
      rawInput: text,
      rawCursorPos: caret,
      mask,
      definitions,
    })

    setEdit({ text: nextFormatted, caret: nextCursor })
    setRawValue(nextRaw)
  }

  return (
    <>
      <input
        {...props}
        ref={inputRef}
        type="text"
        data-slot="masked-input"
        disabled={disabled}
        value={display}
        onChange={handleChange}
        className={cn(
          "h-control w-full min-w-0 rounded-control border border-input bg-transparent px-3 py-1 text-base shadow-control transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          disabled={disabled}
          value={rawValue ?? ""}
        />
      )}
    </>
  )
}

interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> {
  currency?: string
  locale?: string
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null, formattedValue: string) => void
  min?: number
  max?: number
}

function CurrencyInput({
  currency = "USD",
  locale = "en-US",
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  name,
  disabled,
  className,
  onBlur,
  ref,
  ...props
}: CurrencyInputProps) {
  const { value: centsValue, setValue: setCentsValue } = useControllableState<
    number | null
  >({
    value,
    defaultValue,
    onChange: (val) => {
      const formatted = formatCurrency(val, locale, currency)
      onValueChange?.(val, formatted)
    },
  })

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const [edit, setEdit] = React.useState<{
    text: string
    caret: number
  } | null>(null)

  const display =
    edit !== null && parseCurrency(edit.text, locale, currency) === centsValue
      ? edit.text
      : centsValue !== null && centsValue !== undefined
        ? formatCurrency(centsValue, locale, currency)
        : ""

  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (input && document.activeElement === input && edit !== null) {
      input.setSelectionRange(edit.caret, edit.caret)
    }
  }, [edit])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value: rawInput, selectionStart } = event.target
    const { inputType } = (event.nativeEvent as InputEvent) || {}
    const isForward = inputType === "deleteContentForward"

    const { text, caret } = deleteCurrencyDigitPastFormatting(
      display,
      rawInput,
      selectionStart ?? rawInput.length,
      isForward,
      locale
    )

    if (!text.trim()) {
      setEdit(null)
      setCentsValue(null)
      return
    }

    const { formatted, cents } = formatCurrencyLive(text, locale, currency)

    let finalCents = cents
    let finalFormatted = formatted

    if (finalCents !== null && max !== undefined && finalCents > max) {
      finalCents = max
      finalFormatted = formatCurrency(max, locale, currency)
    }

    const nextCursor = calculateCurrencyCaretPosition({
      nextFormatted: finalFormatted,
      rawInput: text,
      rawCursorPos: caret,
      locale,
      currency,
    })

    setEdit({ text: finalFormatted, caret: nextCursor })
    setCentsValue(finalCents)
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    setEdit(null)
    if (centsValue !== null) {
      const clamped = Math.min(
        max ?? Infinity,
        Math.max(min ?? -Infinity, centsValue)
      )
      if (clamped !== centsValue) {
        setCentsValue(clamped)
      }
    }
    onBlur?.(event)
  }

  return (
    <>
      <input
        {...props}
        ref={inputRef}
        type="text"
        inputMode="decimal"
        data-slot="currency-input"
        disabled={disabled}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          "h-control w-full min-w-0 rounded-control border border-input bg-transparent px-3 py-1 text-base shadow-control transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          disabled={disabled}
          value={
            centsValue !== null && centsValue !== undefined ? centsValue : ""
          }
        />
      )}
    </>
  )
}

export {
  MaskedInput,
  CurrencyInput,
  type MaskedInputProps,
  type CurrencyInputProps,
}
