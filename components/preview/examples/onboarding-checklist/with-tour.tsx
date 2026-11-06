"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import {
  OnboardingChecklist,
  type OnboardingChecklistItem,
} from "@/registry/default/ui/onboarding-checklist"
import { Tour, TourTarget, type TourStep } from "@/registry/default/ui/tour"

const TOUR_STEPS: TourStep[] = [
  {
    target: "checklist-card",
    title: "Onboarding checklist",
    description:
      "Follow these guided steps to complete your initial workspace configuration.",
    side: "bottom",
  },
  {
    target: "dashboard-stats",
    title: "Workspace overview",
    description: "Key metrics and project deployment status will appear here.",
    side: "top",
  },
]

export function OnboardingChecklistWithTourPreview() {
  const [isTourOpen, setIsTourOpen] = React.useState(false)
  const [completed, setCompleted] = React.useState<string[]>([])

  const items: OnboardingChecklistItem[] = [
    {
      id: "take-tour",
      title: "Take interactive platform tour",
      description:
        "Learn how to navigate projects, settings, and team collaboration.",
      action: {
        label: "Start tour",
        onClick: () => setIsTourOpen(true),
      },
    },
    {
      id: "customize-theme",
      title: "Customize theme and branding",
      description:
        "Pick your brand accent colors and customize navigation styles.",
    },
  ]

  const handleTourChange = (open: boolean) => {
    setIsTourOpen(open)
    if (!open && !completed.includes("take-tour")) {
      setCompleted((prev) => [...prev, "take-tour"])
    }
  }

  return (
    <Tour steps={TOUR_STEPS} open={isTourOpen} onOpenChange={handleTourChange}>
      <div className="flex w-full max-w-xl flex-col gap-6">
        <TourTarget name="checklist-card">
          <OnboardingChecklist
            title="Getting started"
            description="Complete the platform tour to get oriented."
            items={items}
            completed={completed}
            onCompletedChange={setCompleted}
          />
        </TourTarget>

        <TourTarget name="dashboard-stats">
          <div className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <SparklesIcon className="size-4" />
              Workspace analytics dashboard
            </span>
            <span className="text-xs">0 active deploys</span>
          </div>
        </TourTarget>
      </div>
    </Tour>
  )
}
