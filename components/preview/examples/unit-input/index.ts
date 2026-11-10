import { UnitInputBinaryPreview } from "@/components/preview/examples/unit-input/binary"
import { UnitInputCustomUnitsPreview } from "@/components/preview/examples/unit-input/custom-units"
import { UnitInputFormPreview } from "@/components/preview/examples/unit-input/form"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "binary",
    title: "Binary units",
    description:
      "BINARY_BYTE_UNITS steps by 1024, for operating system quantities.",
    Preview: UnitInputBinaryPreview,
  },
  {
    id: "custom-units",
    title: "Your own units",
    description:
      "A unit is { id, label, factor }. min and max stay in the base unit, and step moves the number on screen.",
    Preview: UnitInputCustomUnitsPreview,
  },
  {
    id: "form",
    title: "Forms",
    description: "name submits the base value through a hidden input.",
    Preview: UnitInputFormPreview,
  },
]
