"use client"

import * as React from "react"

import {
  OnboardingChecklist,
  type OnboardingChecklistItem,
} from "@/registry/default/ui/onboarding-checklist"

const INITIAL_ITEMS: OnboardingChecklistItem[] = [
  {
    id: "verify-email",
    title: "Verify your email address",
    description:
      "Confirm your account email to enable security alerts and notifications.",
    action: {
      label: "Resend email",
      onClick: () => alert("Verification email sent!"),
    },
  },
  {
    id: "create-project",
    title: "Create your first project",
    description:
      "Set up a workspace repository and configure basic environment settings.",
    action: {
      label: "New project",
      onClick: () => alert("Opening project creation dialog..."),
    },
  },
  {
    id: "invite-team",
    title: "Invite your teammates",
    description:
      "Add collaborators to share components and review pull requests together.",
    action: {
      label: "Invite members",
      onClick: () => alert("Opening team invitation modal..."),
    },
  },
  {
    id: "connect-github",
    title: "Connect GitHub organization",
    description:
      "Link your GitHub account to enable automatic CI/CD deployment previews.",
    action: {
      label: "Connect GitHub",
      href: "#github",
    },
  },
  {
    id: "set-up-billing",
    title: "Add a payment method",
    description:
      "Upgrade your team plan to unlock unlimited projects and team members.",
    action: {
      label: "Add card",
      onClick: () => alert("Opening billing setup..."),
    },
  },
]

export function OnboardingChecklistPreview() {
  return (
    <div className="w-full max-w-xl">
      <OnboardingChecklist
        title="Workspace setup"
        description="Complete these steps to get your team ready for production."
        items={INITIAL_ITEMS}
        defaultCompleted={["verify-email", "create-project"]}
      />
    </div>
  )
}
