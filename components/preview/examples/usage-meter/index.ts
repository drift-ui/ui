import { UsageMeterOveragePreview } from "@/components/preview/examples/usage-meter/overage"
import { UsageMeterSegmentedPreview } from "@/components/preview/examples/usage-meter/segmented"
import { UsageMeterThresholdsPreview } from "@/components/preview/examples/usage-meter/thresholds"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "segmented",
    title: "Segmented breakdown",
    description:
      "Stack multiple category segments with an automatic legend, shared palette, and category proportions.",
    Preview: UsageMeterSegmentedPreview,
  },
  {
    id: "thresholds",
    title: "Custom thresholds",
    description:
      "Configure warning and danger thresholds using ratios or absolute numbers for quota management.",
    Preview: UsageMeterThresholdsPreview,
  },
  {
    id: "overage",
    title: "Overage tracking",
    description:
      "Visualizes resource usage that exceeds 100% capacity without clipping, displaying overage badges and boundary markers.",
    Preview: UsageMeterOveragePreview,
  },
]
