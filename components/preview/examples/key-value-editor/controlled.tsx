"use client"

import * as React from "react"

import {
  KeyValueEditor,
  type KeyValueRow,
} from "@/registry/default/ui/key-value-editor"

export function KeyValueEditorControlledPreview() {
  const [rows, setRows] = React.useState<KeyValueRow[]>([
    { id: "1", key: "Accept", value: "application/json" },
    { id: "2", key: "Accept", value: "text/plain" },
  ])
  return (
    <div className="grid w-full max-w-lg gap-3">
      <KeyValueEditor
        aria-label="Request headers"
        keyLabel="Header"
        keyPlaceholder="Header"
        value={rows}
        onValueChange={setRows}
      />
      <pre className="rounded-md bg-muted p-3 font-mono text-xs">
        {rows.map((row) => `${row.key}: ${row.value}`).join("\n") || " "}
      </pre>
    </div>
  )
}
