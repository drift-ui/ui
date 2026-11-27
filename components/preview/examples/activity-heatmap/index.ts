import { ActivityHeatmapBasicPreview } from "@/components/preview/examples/activity-heatmap/basic"
import { ActivityHeatmapInteractivePreview } from "@/components/preview/examples/activity-heatmap/interactive"
import { ActivityHeatmapThresholdsPreview } from "@/components/preview/examples/activity-heatmap/thresholds"
import { ActivityHeatmapTooltipPreview } from "@/components/preview/examples/activity-heatmap/tooltip"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Basic activity calendar",
    description:
      "Display daily activity levels over six months with a Monday week start.",
    Preview: ActivityHeatmapBasicPreview,
  },
  {
    id: "interactive",
    title: "Interactive day selection",
    description:
      "Controlled day selection revealing detailed counts and intensity level in a callout.",
    Preview: ActivityHeatmapInteractivePreview,
  },
  {
    id: "thresholds",
    title: "Custom thresholds & units",
    description:
      "Map discrete count bands to intensity levels with custom units and summary formatting.",
    Preview: ActivityHeatmapThresholdsPreview,
  },
  {
    id: "tooltip",
    title: "Custom tooltip formatting",
    description:
      "Render a rich floating tooltip with intensity badges and activity breakdown on hover and focus.",
    Preview: ActivityHeatmapTooltipPreview,
  },
]
