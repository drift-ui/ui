"use client"

import * as React from "react"
import type { CountryCode } from "libphonenumber-js"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  caretAfterDigits,
  changeCountry,
  countDigits,
  countryForValue,
  deleteDigitPastFormatting,
  filterCountries,
  formatInsertedPhone,
  formatPhoneInput,
  formatPhoneValue,
  isAllowedNumber,
  resolveCountries,
  type PhoneCountry,
  type PhoneCountryOption,
} from "@/registry/default/lib/phone-input.ts"
import { cn } from "@/registry/default/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

function scrollOptionIntoList(option: HTMLElement | null) {
  const list = option?.parentElement
  if (!option || !list) return
  const bottom = option.offsetTop + option.offsetHeight
  if (option.offsetTop < list.scrollTop) {
    list.scrollTop = option.offsetTop
  } else if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight
  }
}

function CountryPicker({
  countries,
  country,
  disabled,
  onSelect,
}: {
  countries: PhoneCountry[]
  country: CountryCode
  disabled?: boolean
  onSelect: (country: CountryCode) => void
}) {
  const listId = React.useId()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)

  const current = countries.find((option) => option.code === country)
  const matches = filterCountries(countries, query)

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen)
    if (!nextOpen) return
    setQuery("")
    setHighlightedIndex(
      Math.max(
        0,
        countries.findIndex((option) => option.code === country)
      )
    )
  }

  function select(code: CountryCode) {
    onSelect(code)
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault()
        if (matches.length === 0) return
        const delta = event.key === "ArrowDown" ? 1 : -1
        setHighlightedIndex(
          (highlightedIndex + delta + matches.length) % matches.length
        )
        return
      }
      case "Enter": {
        event.preventDefault()
        const match = matches[highlightedIndex]
        if (match) select(match.code)
        return
      }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        data-slot="phone-input-country"
        className="flex shrink-0 items-center gap-1 rounded-l-control border-r border-input px-2 text-muted-foreground tabular-nums transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:cursor-not-allowed"
      >
        <span className="sr-only">Country: {current?.name},</span>{" "}
        <span aria-hidden="true">{current?.flag}</span>
        <span>{current?.dialCode}</span>
        <ChevronDownIcon className="size-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Choose a country"
        className="flex w-72 flex-col gap-1 p-1"
      >
        <input
          type="text"
          role="combobox"
          data-slot="phone-input-search"
          aria-label="Search countries"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={
            matches.length > 0 ? `${listId}-${highlightedIndex}` : undefined
          }
          value={query}
          placeholder="Search countries"
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          className="h-8 w-full rounded-sm bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div
          id={listId}
          role="listbox"
          aria-label="Countries"
          data-slot="phone-input-list"
          className="relative max-h-64 overflow-y-auto"
        >
          {matches.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No results
            </p>
          ) : (
            matches.map((option, index) => (
              <div
                key={option.code}
                ref={
                  index === highlightedIndex ? scrollOptionIntoList : undefined
                }
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.code === country}
                data-highlighted={index === highlightedIndex ? "" : undefined}
                onPointerMove={() => setHighlightedIndex(index)}
                onClick={() => select(option.code)}
                className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
              >
                <span aria-hidden="true">{option.flag}</span>
                <span className="min-w-0 flex-1 truncate">{option.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {option.dialCode}
                </span>
                {option.code === country && (
                  <CheckIcon className="size-4 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  defaultCountry?: CountryCode
  countries?: PhoneCountryOption[]
  excludedCountries?: CountryCode[]
}

function PhoneInput({
  value,
  defaultValue = "",
  onValueChange,
  defaultCountry = "US",
  countries,
  excludedCountries,
  name,
  disabled,
  autoComplete = "tel",
  className,
  ref,
  ...props
}: PhoneInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const { value: phone, setValue: setPhone } = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [selectedCountry, setSelectedCountry] = React.useState(defaultCountry)
  const [edit, setEdit] = React.useState({ text: "", caret: 0 })
  const [announcement, setAnnouncement] = React.useState("")

  const allowedCountries = resolveCountries(countries, excludedCountries)
  const country = countryForValue(phone, selectedCountry, allowedCountries)
  const display =
    formatPhoneInput(edit.text, country).value === phone
      ? edit.text
      : formatPhoneValue(phone, country)

  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (input && document.activeElement === input) {
      input.setSelectionRange(edit.caret, edit.caret)
    }
  }, [edit])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value: raw, selectionStart } = event.target
    const { inputType } = event.nativeEvent as InputEvent
    const { text, caret } = deleteDigitPastFormatting(
      display,
      raw,
      selectionStart ?? raw.length,
      inputType === "deleteContentForward"
    )
    const isWholeInsert =
      !inputType || /^insert(From|Replacement)/.test(inputType)
    const next = isWholeInsert
      ? formatInsertedPhone(text, country, allowedCountries)
      : { ...formatPhoneInput(text, country), country }
    const isDeletion = inputType?.startsWith("delete")
    if (!isDeletion && !isAllowedNumber(next.value, allowedCountries)) {
      setEdit({ text: display, caret: display.length })
      setAnnouncement("Numbers from this country are not accepted")
      return
    }
    setAnnouncement("")
    setSelectedCountry(next.country)
    setEdit({
      text: next.display,
      caret: caretAfterDigits(next.display, countDigits(text.slice(0, caret))),
    })
    setPhone(next.value)
  }

  function handleCountrySelect(next: CountryCode) {
    const { display: nextDisplay, value: nextValue } = changeCountry(
      phone,
      country,
      next
    )
    setSelectedCountry(next)
    setEdit({ text: nextDisplay, caret: nextDisplay.length })
    setPhone(nextValue)
  }

  return (
    <div
      data-slot="phone-input"
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "flex h-control w-full min-w-0 rounded-control border border-input bg-transparent text-base shadow-control transition-[color,box-shadow] md:text-sm dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <CountryPicker
        countries={allowedCountries}
        country={country}
        disabled={disabled}
        onSelect={handleCountrySelect}
      />
      <input
        {...props}
        ref={inputRef}
        type="tel"
        data-slot="phone-input-field"
        autoComplete={autoComplete}
        disabled={disabled}
        value={display}
        onChange={handleChange}
        className="min-w-0 flex-1 rounded-r-control bg-transparent px-2.5 tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      {name && (
        <input type="hidden" name={name} disabled={disabled} value={phone} />
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}

export {
  PhoneInput,
  type PhoneCountry,
  type PhoneCountryOption,
  type PhoneInputProps,
}
