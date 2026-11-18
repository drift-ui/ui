"use client"

import * as React from "react"

import { RegexInput } from "@/registry/default/ui/regex-input"

const SAMPLE = `Created order #1042 on 2026-05-18 for $120.50
Created order #1043 on 2026-05-19 for $89.00`

export function RegexInputCaptureGroupsPreview() {
  const [pattern, setPattern] = React.useState(
    "order #(?<orderId>\\d+) on (?<date>\\d{4}-\\d{2}-\\d{2}) for \\$(?<amount>\\d+\\.\\d{2})"
  )

  return (
    <div className="w-full max-w-md">
      <RegexInput
        aria-label="Order extractor"
        value={pattern}
        onValueChange={setPattern}
        sample={SAMPLE}
      />
    </div>
  )
}
