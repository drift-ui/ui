import { CronInputBasicPreview } from "@/components/preview/examples/cron-input/basic"
import { CronInputPresetsPreview } from "@/components/preview/examples/cron-input/presets"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Basic cron input",
    description:
      "A standard five-field cron input with a plain-English schedule readout and next run times.",
    Preview: CronInputBasicPreview,
  },
  {
    id: "presets",
    title: "Preset schedules",
    description:
      "Controlled cron input paired with quick preset buttons for common recurring intervals.",
    Preview: CronInputPresetsPreview,
  },
]
