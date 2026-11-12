"use client"

import * as React from "react"

import { findUnknownVariables } from "@/registry/default/lib/template-input-utils"
import { TemplateInput } from "@/registry/base/ui/template-input"

const VARIABLES = [
  { value: "event", label: "Event type", description: "push, release" },
  { value: "repo", label: "Repository" },
  { value: "actor", label: "Who triggered it" },
]

export function TemplateInputUnknownVariablesPreview() {
  const [template, setTemplate] = React.useState(
    '{"text": "{{actor}} ran {{event}} on {{repository}}"}'
  )
  const unknown = findUnknownVariables(template, VARIABLES)

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <TemplateInput
        aria-label="Webhook payload"
        aria-invalid={unknown.length > 0}
        variables={VARIABLES}
        value={template}
        onValueChange={setTemplate}
        className="font-mono"
      />
      <p className="text-xs text-muted-foreground">
        {unknown.length > 0
          ? `Unknown: ${unknown.join(", ")}`
          : "Every variable is known."}
      </p>
    </div>
  )
}
