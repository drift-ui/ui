"use client"

import * as React from "react"

import { TemplateInput } from "@/registry/base/ui/template-input"

const VARIABLES = [
  { value: "first_name", label: "First name" },
  { value: "plan", label: "Plan name" },
  { value: "renewal_date", label: "Renewal date" },
]

const SAMPLE: Record<string, string> = {
  first_name: "Noor",
  plan: "Team",
  renewal_date: "March 3",
}

export function TemplateInputControlledPreview() {
  const [template, setTemplate] = React.useState(
    "{{first_name}}, your {{plan}} plan renews on {{renewal_date}}"
  )
  const rendered = template.replace(
    /\{\{\s*([^{}\s]+)\s*\}\}/g,
    (match, name: string) => SAMPLE[name] ?? match
  )

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <TemplateInput
        aria-label="Email subject"
        variables={VARIABLES}
        value={template}
        onValueChange={setTemplate}
      />
      <p className="text-xs text-muted-foreground">Preview: {rendered}</p>
    </div>
  )
}
