"use client"

import * as React from "react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  autoCompleteFor,
  changeAddressCountry,
  emptyAddress,
  isRequired,
  labelFor,
  layoutFor,
  postalCodeError,
  resolveCountryOptions,
  type Address,
  type AddressField,
  type AddressLayout,
  type AddressLayouts,
  type AddressType,
} from "@/registry/default/lib/address-input"
import { countryFlag } from "@/registry/default/lib/countries"
import { cn } from "@/registry/default/lib/utils"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"

const ROW_COLUMNS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
}

type AddressInputProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  value?: Address
  defaultValue?: Partial<Address>
  onValueChange?: (address: Address) => void
  defaultCountry?: string
  countries?: string[]
  layouts?: AddressLayouts
  locale?: string
  addressType?: AddressType
  name?: string
  disabled?: boolean
}

function AddressInput({
  value,
  defaultValue,
  onValueChange,
  defaultCountry = "US",
  countries,
  layouts,
  locale,
  addressType,
  name,
  disabled,
  className,
  ...props
}: AddressInputProps) {
  const [initialAddress] = React.useState(() => ({
    ...emptyAddress(defaultCountry),
    ...defaultValue,
  }))
  const { value: address, setValue: setAddress } = useControllableState({
    value,
    defaultValue: initialAddress,
    onChange: onValueChange,
  })
  const [isPostalCodeTouched, setIsPostalCodeTouched] = React.useState(false)
  const postalCodeRef = React.useRef<HTMLInputElement>(null)
  const id = React.useId()

  const layout = layoutFor(address.country, layouts)
  const countryOptions = resolveCountryOptions(
    address.country,
    countries,
    locale
  )
  const postalError = postalCodeError(address, layouts)

  React.useEffect(() => {
    postalCodeRef.current?.setCustomValidity(postalError ?? "")
  }, [postalError])

  function fieldName(field: AddressField | "country") {
    return name ? `${name}.${field}` : undefined
  }

  function editField(field: AddressField, text: string) {
    setAddress({ ...address, [field]: text })
  }

  function changeCountry(country: string) {
    setAddress(changeAddressCountry(address, country, layouts))
  }

  function renderField(field: AddressField, fieldLayout: AddressLayout) {
    const inputId = `${id}-${field}`
    const errorId = `${inputId}-error`
    const isPostalCode = field === "postalCode"
    const error = isPostalCode && isPostalCodeTouched ? postalError : null
    const required = isRequired(field, fieldLayout)

    return (
      <div
        key={field}
        data-slot="address-input-field"
        data-field={field}
        className="grid gap-1.5"
      >
        <Label htmlFor={inputId}>
          {labelFor(field, fieldLayout)}{" "}
          {!required && (
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          )}
        </Label>
        <Input
          ref={isPostalCode ? postalCodeRef : undefined}
          id={inputId}
          name={fieldName(field)}
          value={address[field]}
          onChange={(event) => editField(field, event.target.value)}
          onBlur={isPostalCode ? () => setIsPostalCodeTouched(true) : undefined}
          onInvalid={
            isPostalCode ? () => setIsPostalCodeTouched(true) : undefined
          }
          autoComplete={autoCompleteFor(field, addressType)}
          autoCapitalize={isPostalCode ? "characters" : undefined}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <p
            id={errorId}
            data-slot="address-input-error"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      role="group"
      data-slot="address-input"
      data-disabled={disabled ? "" : undefined}
      className={cn("grid w-full gap-3", className)}
      {...props}
    >
      <div data-slot="address-input-field" className="grid gap-1.5">
        <Label htmlFor={`${id}-country`}>Country or region</Label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          >
            {countryFlag(address.country)}
          </span>
          <select
            id={`${id}-country`}
            name={fieldName("country")}
            value={address.country}
            onChange={(event) => changeCountry(event.target.value)}
            autoComplete={autoCompleteFor("country", addressType)}
            disabled={disabled}
            data-slot="address-input-country"
            className="h-9 w-full rounded-md border border-input bg-transparent pr-2 pl-9 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground"
          >
            {countryOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {layout.rows.map((row) => (
        <div
          key={row.join("-")}
          className={cn("grid gap-3", ROW_COLUMNS[row.length])}
        >
          {row.map((field) => renderField(field, layout))}
        </div>
      ))}
    </div>
  )
}

export {
  AddressInput,
  type Address,
  type AddressInputProps,
  type AddressLayout,
  type AddressLayouts,
}
