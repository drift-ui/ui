"use client"

import { SegmentedControl } from "@/components/docs/segmented-control"
import { CopyCommand } from "@/components/landing/copy-command"
import { usePackageManager } from "@/hooks/use-package-manager"
import { PACKAGE_MANAGERS, shadcnCommand } from "@/lib/package-manager"

const PACKAGE_MANAGER_ITEMS = PACKAGE_MANAGERS.map((value) => ({
  value,
  label: value,
}))

export function HandInstallSteps() {
  const { packageManager, setPackageManager } = usePackageManager()

  const steps = [
    {
      title: "Set up shadcn",
      note: "Skip this if the project already has a components.json.",
      body: (
        <CopyCommand
          command={shadcnCommand(packageManager, "init")}
          className="w-full"
        />
      ),
    },
    {
      title: "Add a component",
      note: "Use any name from the catalog. Its dependencies come with it.",
      body: (
        <CopyCommand
          command={shadcnCommand(packageManager, "add @drift-ui/tags-input")}
          className="w-full"
        />
      ),
    },
    {
      title: "Import it",
      note: "The source is now yours, in your ui folder.",
      body: (
        <code className="block min-h-10 rounded-md border bg-card/60 px-3.5 py-2 font-mono text-[13px] text-muted-foreground">
          <span>import</span>
          <span className="text-foreground">{" { TagsInput } "}</span>
          <span>from</span>
          <span className="text-foreground">
            {' "@/components/ui/tags-input"'}
          </span>
        </code>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        items={PACKAGE_MANAGER_ITEMS}
        value={packageManager}
        onValueChange={setPackageManager}
        label="Package manager"
        className="w-fit overflow-x-auto font-mono [&>*]:text-xs"
      />
      <ol className="grid border-t lg:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.title}
            className="flex min-w-0 flex-col gap-4 border-b py-6 lg:pr-6 lg:[&+&]:border-l lg:[&+&]:pl-6"
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">{step.note}</p>
            </div>
            <div className="mt-auto">{step.body}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}
