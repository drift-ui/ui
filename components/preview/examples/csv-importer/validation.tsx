"use client"

import * as React from "react"

import { CsvImporter } from "@/registry/default/ui/csv-importer"

export function CsvImporterValidationPreview() {
  const [data, setData] = React.useState<Record<string, unknown>[] | null>(null)

  return (
    <div className="w-full max-w-xl space-y-4">
      {data ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm font-medium">
          Ready: {data.length} validated records!
        </div>
      ) : (
        <CsvImporter
          fields={[
            {
              id: "sku",
              label: "Product SKU",
              required: true,
              validate: (val) =>
                /^PROD-\d{4}$/.test(String(val))
                  ? true
                  : "SKU format must match PROD-XXXX",
            },
            {
              id: "price",
              label: "Unit Price ($)",
              required: true,
              validate: (val) =>
                Number(val) > 0 ? true : "Price must be a positive number",
            },
            {
              id: "inventory",
              label: "Stock Count",
              validate: (val) =>
                !val || Number.isInteger(Number(val))
                  ? true
                  : "Must be a whole number",
            },
          ]}
          onComplete={(rows) => setData(rows)}
        />
      )}
    </div>
  )
}
