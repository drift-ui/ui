import { LocalePickerLanguageOnlyPreview } from "@/components/preview/examples/locale-picker/language-only"
import { LocalePickerLimitedListPreview } from "@/components/preview/examples/locale-picker/limited-list"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "limited-list",
    title: "A short list",
    description:
      "Pass locales to restrict choices to the specific regional BCP 47 locales your application supports.",
    Preview: LocalePickerLimitedListPreview,
  },
  {
    id: "language-only",
    title: "Language tags without regions",
    description:
      "Language-level tags such as 'de' or 'fr' display native and English names without regional country flags.",
    Preview: LocalePickerLanguageOnlyPreview,
  },
]
