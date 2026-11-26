"use client"

import * as React from "react"

import { RegexInput } from "@/registry/default/ui/regex-input"

const LOG_SAMPLE = `[2026-05-18T10:14:02Z] [INFO] Request completed in 24ms
[2026-05-18T10:14:05Z] [WARN] Connection pool reaching capacity (85%)
[2026-05-18T10:14:09Z] [ERROR] Database timeout on replica-02
[2026-05-18T10:14:12Z] [ERROR] Health check failed for redis-cache`

export function RegexInputLogFilterPreview() {
  const [pattern, setPattern] = React.useState(
    "\\[(ERROR|WARN)\\]\\s+(?<message>.*)"
  )
  const [flags, setFlags] = React.useState("i")

  return (
    <div className="w-full max-w-md">
      <RegexInput
        aria-label="Log filter pattern"
        value={pattern}
        onValueChange={setPattern}
        flags={flags}
        onFlagsChange={setFlags}
        sample={LOG_SAMPLE}
      />
    </div>
  )
}
