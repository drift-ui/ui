"use client"

import * as React from "react"

import { AddressInput, type Address } from "@/registry/default/ui/address-input"

export function AddressInputPreview() {
  const [address, setAddress] = React.useState<Address>({
    country: "US",
    line1: "1 Market St",
    line2: "Suite 300",
    city: "San Francisco",
    region: "CA",
    postalCode: "94105",
  })

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <AddressInput
        aria-label="Shipping address"
        value={address}
        onValueChange={setAddress}
      />
      <p className="text-xs text-muted-foreground">
        Try it: switch to Japan or the United Kingdom and watch the fields
        reorder, or type a four digit ZIP code and leave the field.
      </p>
    </div>
  )
}
