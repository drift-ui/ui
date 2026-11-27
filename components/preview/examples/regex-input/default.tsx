"use client"

import * as React from "react"

import { RegexInput } from "@/registry/default/ui/regex-input"

const SAMPLE = `Deploying service v1.4.2 to production
Failed to start worker v2.0.0-beta.1
Hotfix v1.4.3 applied successfully`

export function RegexInputDefaultPreview() {
  const [pattern, setPattern] = React.useState("v\\d+\\.\\d+\\.\\d+")

  return (
    <div className="w-full max-w-md">
      <RegexInput
        aria-label="Version pattern"
        value={pattern}
        onValueChange={setPattern}
        sample={SAMPLE}
        placeholder="v\\d+\\.\\d+\\.\\d+"
      />
    </div>
  )
}
