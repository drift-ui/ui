"use client"

import { AddressInput } from "@/registry/default/ui/address-input"

export function AddressInputCountryLayoutsPreview() {
  return (
    <AddressInput
      aria-label="Delivery address"
      defaultCountry="JP"
      className="max-w-md"
    />
  )
}
