import { MergeResolverBasicPreview } from "@/components/preview/examples/merge-resolver/basic"
import { MergeResolverCustomPreview } from "@/components/preview/examples/merge-resolver/custom"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "basic",
    title: "Basic conflict resolution",
    description:
      "Per-field merge resolver with diff highlights, remaining conflict announcements, and bulk accept buttons.",
    Preview: MergeResolverBasicPreview,
  },
  {
    id: "custom",
    title: "Controlled state and custom overrides",
    description:
      "Controlled conflict resolutions with pre-selected custom overrides and external reset controls.",
    Preview: MergeResolverCustomPreview,
  },
]
