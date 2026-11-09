"use client"

import * as React from "react"

import { CsvImporter } from "@/registry/default/ui/csv-importer"

export function CsvImporterBasicPreview() {
  const [imported, setImported] = React.useState<number | null>(null)

  return (
    <div className="w-full max-w-xl space-y-4">
      {imported !== null ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm">
          Imported {imported} contacts!
        </div>
      ) : (
        <CsvImporter
          fields={[
            { id: "name", label: "Full Name", required: true },
            { id: "email", label: "Email Address", required: true },
            { id: "phone", label: "Phone Number" },
          ]}
          onComplete={(rows) => setImported(rows.length)}
        />
      )}
    </div>
  )
}
