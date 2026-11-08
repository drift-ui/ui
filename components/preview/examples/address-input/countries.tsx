"use client"

import { AddressInput } from "@/registry/default/ui/address-input"

export function AddressInputCountriesPreview() {
  return (
    <AddressInput
      aria-label="Shipping address"
      defaultCountry="CA"
      countries={["CA", "US", "MX"]}
      className="max-w-md"
    />
  )
}
