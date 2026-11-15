import { AvailabilityGridBasicPreview } from "@/components/preview/examples/availability-grid/basic"
import { AvailabilityGridTimezonePreview } from "@/components/preview/examples/availability-grid/timezone"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Weekly working hours",
    description: "A standard Monday to Friday availability schedule.",
    Preview: AvailabilityGridBasicPreview,
  },
  {
    id: "timezone",
    title: "Time zone conversion",
    description:
      "Switch between time zones to see slots shift and split across midnight.",
    Preview: AvailabilityGridTimezonePreview,
  },
]
