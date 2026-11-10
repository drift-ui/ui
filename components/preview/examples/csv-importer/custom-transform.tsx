"use client"

import * as React from "react"

import { CsvImporter } from "@/registry/default/ui/csv-importer"

export function CsvImporterCustomTransformPreview() {
  const [data, setData] = React.useState<Record<string, unknown>[] | null>(null)

  return (
    <div className="w-full max-w-xl space-y-4">
      {data ? (
        <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <CsvImporter
          fields={[
            {
              id: "username",
              label: "Username",
              required: true,
              transform: (val) => val.trim().toLowerCase(),
            },
            {
              id: "amount",
              label: "Transaction Amount",
              validate: (val) =>
                typeof val === "string" &&
                /^-?\d+(\.\d{1,2})?$/.test(val.trim())
                  ? true
                  : "Must be a valid decimal amount",
              transform: (val) => parseFloat(val.trim()),
            },
            {
              id: "isActive",
              label: "Active Status",
              transform: (val) =>
                ["true", "yes", "1"].includes(val.trim().toLowerCase()),
            },
          ]}
          onComplete={(rows) => setData(rows)}
        />
      )}
    </div>
  )
}
