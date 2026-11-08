"use client"

import {
  AddressInput,
  type AddressLayouts,
} from "@/registry/default/ui/address-input"

const LAYOUTS: AddressLayouts = {
  BR: {
    rows: [["postalCode"], ["line1"], ["line2"], ["city", "region"]],
    required: ["postalCode", "line1", "city", "region"],
    labels: { postalCode: "CEP", region: "State" },
    postalCode: {
      pattern: /^\d{5}-?\d{3}$/,
      format: "8 digits, like 01310-100",
    },
  },
}

export function AddressInputCustomLayoutsPreview() {
  return (
    <AddressInput
      aria-label="Billing address"
      defaultCountry="BR"
      layouts={LAYOUTS}
      className="max-w-md"
    />
  )
}
