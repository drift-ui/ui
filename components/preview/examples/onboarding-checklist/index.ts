import { OnboardingChecklistCollapsiblePreview } from "@/components/preview/examples/onboarding-checklist/collapsible"
import { OnboardingChecklistControlledPreview } from "@/components/preview/examples/onboarding-checklist/controlled"
import { OnboardingChecklistWithTourPreview } from "@/components/preview/examples/onboarding-checklist/with-tour"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "controlled",
    title: "Controlled state",
    description:
      "Pass completed and onCompletedChange to manage completion state externally, with callback logging on each toggle.",
    Preview: OnboardingChecklistControlledPreview,
  },
  {
    id: "collapsible",
    title: "Collapsible checklist",
    description:
      "Allow users to collapse the checklist once they understand the flow, keeping only the header and progress bar visible.",
    Preview: OnboardingChecklistCollapsiblePreview,
  },
  {
    id: "with-tour",
    title: "With interactive tour",
    description:
      "Trigger an onboarding tour from an action button and automatically complete the checklist task upon tour completion.",
    Preview: OnboardingChecklistWithTourPreview,
  },
]
