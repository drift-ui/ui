import { RegexInputCaptureGroupsPreview } from "@/components/preview/examples/regex-input/capture-groups"
import { RegexInputDefaultPreview } from "@/components/preview/examples/regex-input/default"
import { RegexInputLogFilterPreview } from "@/components/preview/examples/regex-input/log-filter"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "default",
    title: "Default",
    description:
      "Pattern input with flag toggles, live match highlight, and count badge.",
    Preview: RegexInputDefaultPreview,
  },
  {
    id: "capture-groups",
    title: "Capture groups",
    description: "Inspect named capture groups per match.",
    Preview: RegexInputCaptureGroupsPreview,
  },
  {
    id: "log-filter",
    title: "Log filter",
    description:
      "Match severity levels and extract messages from real-world server logs.",
    Preview: RegexInputLogFilterPreview,
  },
]
