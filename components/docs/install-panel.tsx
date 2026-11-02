"use client"

import { useState } from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { CopyCommand } from "@/components/landing/copy-command"
import { ManualSteps } from "@/components/docs/manual-steps"
import { SegmentedControl } from "@/components/docs/segmented-control"
import { TabsRail } from "@/components/docs/tabs-rail"
import { usePackageManager } from "@/hooks/use-package-manager"
import type { BuildsOn } from "@/lib/component-docs"
import { PACKAGE_MANAGERS, shadcnAddCommand } from "@/lib/package-manager"

const METHODS = [
  { value: "cli", label: "CLI" },
  { value: "manual", label: "Manual" },
]

const PACKAGE_MANAGER_ITEMS = PACKAGE_MANAGERS.map((value) => ({
  value,
  label: value,
}))

export function InstallPanel({
  slug,
  dependencies,
  buildsOn,
  installPaths,
}: {
  slug: string
  dependencies: string[]
  buildsOn: BuildsOn[]
  installPaths: string[]
}) {
  const [method, setMethod] = useState("cli")
  const { packageManager, setPackageManager } = usePackageManager()

  return (
    <TabsPrimitive.Root
      value={method}
      onValueChange={setMethod}
      className="overflow-hidden rounded-2xl border"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-1.5">
        <TabsRail items={METHODS} value={method} label="Install method" />
        <SegmentedControl
          items={PACKAGE_MANAGER_ITEMS}
          value={packageManager}
          onValueChange={setPackageManager}
          label="Package manager"
          className="overflow-x-auto font-mono [&>*]:text-xs"
        />
      </div>
      <TabsPrimitive.Content value="cli" className="p-5 outline-none">
        <CopyCommand
          command={shadcnAddCommand(packageManager, slug)}
          className="w-full"
        />
        <p className="mt-4 text-sm text-muted-foreground">
          The CLI also installs the npm packages and registry items it builds
          on, and reads the style in your components.json to pick the Base UI or
          Radix build.
        </p>
      </TabsPrimitive.Content>
      <TabsPrimitive.Content value="manual" className="p-5 outline-none">
        <ManualSteps
          packageManager={packageManager}
          dependencies={dependencies}
          buildsOn={buildsOn}
          installPaths={installPaths}
        />
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  )
}
