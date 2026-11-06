import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  OnboardingChecklist,
  type OnboardingChecklistItem,
} from "@/registry/default/ui/onboarding-checklist"

const SAMPLE_ITEMS: OnboardingChecklistItem[] = [
  {
    id: "step-1",
    title: "Verify email",
    description: "Check your inbox for a verification link.",
    action: {
      label: "Resend",
      onClick: vi.fn(),
    },
  },
  {
    id: "step-2",
    title: "Create organization",
    description: "Set up your team workspace.",
    action: {
      label: "Docs",
      href: "https://drift-ui.dev",
    },
  },
  {
    id: "step-3",
    title: "Invite teammates",
    description: "Add members to your workspace.",
    disabled: true,
  },
]

describe("OnboardingChecklist", () => {
  it("renders title, description, progress bar, and items with accessible labels", () => {
    render(
      <OnboardingChecklist
        title="Account setup"
        description="Complete all steps to activate your account."
        items={SAMPLE_ITEMS}
        defaultCompleted={["step-1"]}
      />
    )

    expect(screen.getByText("Account setup")).toBeInTheDocument()
    expect(
      screen.getByText("Complete all steps to activate your account.")
    ).toBeInTheDocument()

    const progressBar = screen.getByRole("progressbar", {
      name: "Account setup progress",
    })
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute("value", "1")
    expect(progressBar).toHaveAttribute("max", "3")
    expect(progressBar).toHaveAttribute("aria-valuenow", "1")
    expect(progressBar).toHaveAttribute("aria-valuetext", "1 of 3 done")
    expect(screen.getByText("1 of 3 done")).toBeInTheDocument()

    // Checkboxes and labels
    const step1Checkbox = screen.getByRole("checkbox", { name: "Verify email" })
    expect(step1Checkbox).toBeChecked()

    const step2Checkbox = screen.getByRole("checkbox", {
      name: "Create organization",
    })
    expect(step2Checkbox).not.toBeChecked()

    const step3Checkbox = screen.getByRole("checkbox", {
      name: "Invite teammates",
    })
    expect(step3Checkbox).toBeDisabled()
  })

  it("toggles items uncontrolled and updates progress ratio", async () => {
    const user = userEvent.setup()
    render(
      <OnboardingChecklist
        title="Setup"
        items={SAMPLE_ITEMS.slice(0, 2)}
        defaultCompleted={[]}
      />
    )

    expect(screen.getByText("0 of 2 done")).toBeInTheDocument()

    const checkbox1 = screen.getByRole("checkbox", { name: "Verify email" })
    await user.click(checkbox1)

    expect(checkbox1).toBeChecked()
    expect(screen.getByText("1 of 2 done")).toBeInTheDocument()

    const checkbox2 = screen.getByRole("checkbox", {
      name: "Create organization",
    })
    await user.click(checkbox2)

    expect(checkbox2).toBeChecked()
    expect(screen.getByText("2 of 2 done")).toBeInTheDocument()

    // Uncheck first item
    await user.click(checkbox1)
    expect(checkbox1).not.toBeChecked()
    expect(screen.getByText("1 of 2 done")).toBeInTheDocument()
  })

  it("supports controlled completion state with callbacks", async () => {
    const user = userEvent.setup()
    const onCompletedChange = vi.fn()
    const onItemToggle = vi.fn()

    const { rerender } = render(
      <OnboardingChecklist
        items={SAMPLE_ITEMS}
        completed={["step-1"]}
        onCompletedChange={onCompletedChange}
        onItemToggle={onItemToggle}
      />
    )

    const checkbox2 = screen.getByRole("checkbox", {
      name: "Create organization",
    })
    await user.click(checkbox2)

    expect(onCompletedChange).toHaveBeenCalledWith(["step-1", "step-2"])
    expect(onItemToggle).toHaveBeenCalledWith(SAMPLE_ITEMS[1], true)

    // Simulate parent state update
    rerender(
      <OnboardingChecklist
        items={SAMPLE_ITEMS}
        completed={["step-1", "step-2"]}
        onCompletedChange={onCompletedChange}
        onItemToggle={onItemToggle}
      />
    )

    expect(checkbox2).toBeChecked()
    expect(screen.getByText("2 of 3 done")).toBeInTheDocument()
  })

  it("does not toggle disabled items", async () => {
    const user = userEvent.setup()
    const onCompletedChange = vi.fn()

    render(
      <OnboardingChecklist
        items={SAMPLE_ITEMS}
        defaultCompleted={[]}
        onCompletedChange={onCompletedChange}
      />
    )

    const disabledCheckbox = screen.getByRole("checkbox", {
      name: "Invite teammates",
    })
    await user.click(disabledCheckbox)

    expect(disabledCheckbox).not.toBeChecked()
    expect(onCompletedChange).not.toHaveBeenCalled()
  })

  it("handles action buttons and links", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    const items: OnboardingChecklistItem[] = [
      {
        id: "btn-step",
        title: "Clickable action",
        action: { label: "Run action", onClick },
      },
      {
        id: "link-step",
        title: "Link action",
        action: { label: "Open link", href: "https://drift-ui.dev" },
      },
      {
        id: "disabled-step",
        title: "Disabled action",
        action: { label: "Disabled action", onClick: vi.fn(), disabled: true },
      },
    ]

    render(<OnboardingChecklist items={items} />)

    // Button action
    const actionBtn = screen.getByRole("button", { name: "Run action" })
    await user.click(actionBtn)
    expect(onClick).toHaveBeenCalledTimes(1)

    // Link action
    const linkAction = screen.getByRole("link", { name: "Open link" })
    expect(linkAction).toHaveAttribute("href", "https://drift-ui.dev")

    // Disabled button action
    const disabledBtn = screen.getByRole("button", { name: "Disabled action" })
    expect(disabledBtn).toBeDisabled()
  })

  it("supports collapsible mode uncontrolled", async () => {
    const user = userEvent.setup()

    render(
      <OnboardingChecklist
        title="Collapsible setup"
        items={SAMPLE_ITEMS}
        collapsible
        defaultOpen={true}
      />
    )

    const toggleButton = screen.getByRole("button", {
      name: "Collapse checklist",
    })
    expect(toggleButton).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("list")).toBeInTheDocument()

    // Collapse
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute("aria-expanded", "false")
    expect(
      screen.getByRole("button", { name: "Expand checklist" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()

    // Re-expand
    await user.click(screen.getByRole("button", { name: "Expand checklist" }))
    expect(screen.getByRole("list")).toBeInTheDocument()
  })

  it("supports collapsible mode controlled with onOpenChange", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    const { rerender } = render(
      <OnboardingChecklist
        items={SAMPLE_ITEMS}
        collapsible
        open={false}
        onOpenChange={onOpenChange}
      />
    )

    expect(screen.queryByRole("list")).not.toBeInTheDocument()
    const expandBtn = screen.getByRole("button", { name: "Expand checklist" })
    await user.click(expandBtn)
    expect(onOpenChange).toHaveBeenCalledWith(true)

    rerender(
      <OnboardingChecklist
        items={SAMPLE_ITEMS}
        collapsible
        open={true}
        onOpenChange={onOpenChange}
      />
    )
    expect(screen.getByRole("list")).toBeInTheDocument()
  })

  it("supports keyboard toggling with Space on checkboxes", async () => {
    const user = userEvent.setup()

    render(
      <OnboardingChecklist
        items={SAMPLE_ITEMS.slice(0, 1)}
        defaultCompleted={[]}
      />
    )

    const checkbox = screen.getByRole("checkbox", { name: "Verify email" })
    checkbox.focus()
    expect(checkbox).toHaveFocus()

    await user.keyboard(" ")
    expect(checkbox).toBeChecked()

    await user.keyboard(" ")
    expect(checkbox).not.toBeChecked()
  })
})
