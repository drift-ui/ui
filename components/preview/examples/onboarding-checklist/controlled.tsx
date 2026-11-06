"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  OnboardingChecklist,
  type OnboardingChecklistItem,
} from "@/registry/default/ui/onboarding-checklist"

const ITEMS: OnboardingChecklistItem[] = [
  {
    id: "profile",
    title: "Complete company profile",
    description: "Provide company details and timezone for team notifications.",
  },
  {
    id: "domain",
    title: "Verify custom domain",
    description: "Add a CNAME record to route your domain to drift-ui hosting.",
  },
  {
    id: "api-key",
    title: "Generate production API key",
    description:
      "Create an access token with read/write permissions for deployment.",
  },
]

export function OnboardingChecklistControlledPreview() {
  const [completed, setCompleted] = React.useState<string[]>(["profile"])
  const [lastAction, setLastAction] = React.useState<string>(
    "Loaded with 1 completed"
  )

  const handleReset = () => {
    setCompleted([])
    setLastAction("Reset all tasks")
  }

  const handleCompleteAll = () => {
    setCompleted(ITEMS.map((item) => item.id))
    setLastAction("Marked all tasks complete")
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset all
        </Button>
        <Button variant="outline" size="sm" onClick={handleCompleteAll}>
          Complete all
        </Button>
      </div>

      <OnboardingChecklist
        title="Setup guide"
        description="Track your setup progress and sync changes with external state."
        items={ITEMS}
        completed={completed}
        onCompletedChange={setCompleted}
        onItemToggle={(item, isDone) =>
          setLastAction(`${isDone ? "Completed" : "Unchecked"} "${item.title}"`)
        }
      />

      <p className="font-mono text-xs text-muted-foreground">{lastAction}</p>
    </div>
  )
}
