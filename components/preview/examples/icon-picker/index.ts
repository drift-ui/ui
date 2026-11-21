import { IconPickerCustomIconsPreview } from "@/components/preview/examples/icon-picker/custom-icons"
import { IconPickerPopoverPreview } from "@/components/preview/examples/icon-picker/popover"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "popover",
    title: "In a popover",
    description:
      "IconPicker is an inline panel, so place it in a Popover for a compact icon selector. Selecting an icon updates the state and closes the popover.",
    Preview: IconPickerPopoverPreview,
  },
  {
    id: "custom-icons",
    title: "Curated icon set",
    description:
      "Pass a constrained list of icon names and search tags via icons to restrict choices to category-relevant icons.",
    Preview: IconPickerCustomIconsPreview,
  },
]
