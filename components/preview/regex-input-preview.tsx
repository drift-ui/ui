"use client"

import * as React from "react"

import { RegexInput } from "@/registry/default/ui/regex-input"

const SAMPLE_TEXT = `user_alice@drift-ui.dev logged in from 192.168.1.10
support+urgent@example.org reported issue #404
invalid-address@@test
sales@acme.corp requested a demo`

export function RegexInputPreview() {
  const [pattern, setPattern] = React.useState(
    "(?<user>[a-zA-Z0-9._%+-]+)@(?<domain>[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})"
  )
  const [flags, setFlags] = React.useState("i")

  return (
    <div className="w-full max-w-lg">
      <RegexInput
        aria-label="Email pattern"
        value={pattern}
        onValueChange={setPattern}
        flags={flags}
        onFlagsChange={setFlags}
        sample={SAMPLE_TEXT}
        placeholder="Enter regular expression"
      />
    </div>
  )
}
