import { AddressInputCountriesPreview } from "@/components/preview/examples/address-input/countries"
import { AddressInputCountryLayoutsPreview } from "@/components/preview/examples/address-input/country-layouts"
import { AddressInputCustomLayoutsPreview } from "@/components/preview/examples/address-input/custom-layouts"
import { AddressInputFormPreview } from "@/components/preview/examples/address-input/form"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "country-layouts",
    title: "Field order by country",
    description:
      "defaultCountry picks the starting layout. Japan starts with the postal code and asks for the prefecture, Germany puts the postal code before the city, and the United Kingdom has no state field.",
    Preview: AddressInputCountryLayoutsPreview,
  },
  {
    id: "countries",
    title: "Limit the country list",
    description:
      "countries lists only these, in this order, for a store that ships to a few countries. Without it, every country is listed by name.",
    Preview: AddressInputCountriesPreview,
  },
  {
    id: "custom-layouts",
    title: "Add a country layout",
    description:
      "Countries without a built-in layout get a generic one. Pass layouts to give one its own field order, required fields, labels and postal code pattern, here Brazil's CEP.",
    Preview: AddressInputCustomLayoutsPreview,
  },
  {
    id: "form",
    title: "In a form",
    description:
      'name submits each field as name.field, and addressType="billing" scopes the autofill tokens so a page with shipping and billing addresses fills each one correctly. A bad postal code blocks submit and shows its message.',
    Preview: AddressInputFormPreview,
  },
]
