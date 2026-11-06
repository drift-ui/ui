"use client"

import * as React from "react"

import {
  OnboardingChecklist,
  type OnboardingChecklistItem,
} from "@/registry/default/ui/onboarding-checklist"

const ITEMS: OnboardingChecklistItem[] = [
  {
    id: "account-security",
    title: "Enable two-factor authentication",
    description:
      "Secure your account with an authenticator app or security key.",
    action: {
      label: "Enable 2FA",
      onClick: () => alert("Redirecting to security settings..."),
    },
  },
  {
    id: "notifications",
    title: "Configure alert thresholds",
    description: "Choose which channels receive deployment error alerts.",
    action: {
      label: "Set alerts",
      onClick: () => alert("Redirecting to alert preferences..."),
    },
  },
  {
    id: "backup",
    title: "Download recovery codes",
    description: "Store emergency codes safely in your password manager.",
    action: {
      label: "Download",
      onClick: () => alert("Downloading recovery codes..."),
    },
  },
]

export function OnboardingChecklistCollapsiblePreview() {
  const [isOpen, setIsOpen] = React.useState(true)

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <OnboardingChecklist
        title="Account security checklist"
        description="Strengthen your workspace security before launching."
        items={ITEMS}
        defaultCompleted={["account-security"]}
        collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
      />
      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          Checklist state: {isOpen ? "Expanded" : "Collapsed"}
        </span>
      </div>
    </div>
  )
}
