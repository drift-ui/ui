"use client"

import * as React from "react"
import { CheckCircleIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { CsvImporter, type CsvField } from "@/registry/default/ui/csv-importer"

const SAMPLE_CSV = `Full Name,Work Email,Role,Department
Ada Lovelace,ada@computing.org,Pioneer,Engineering
Alan Turing,alan@enigma.gov,Cryptanalyst,Security
Grace Hopper,grace@navy.mil,Rear Admiral,Systems
Margaret Hamilton,margaret@nasa.gov,Director,Software
Katherine Johnson,katherine@nasa.gov,Mathematician,Navigation
Invalid Person,bad-email,Intern,Support`

const FIELDS: CsvField[] = [
  {
    id: "name",
    label: "Full Name",
    required: true,
    description: "The team member's full legal or preferred name",
  },
  {
    id: "email",
    label: "Work Email",
    required: true,
    description: "Company email address for notifications and SSO",
    validate: (val) =>
      typeof val === "string" && val.includes("@")
        ? true
        : "Must be a valid email address",
  },
  {
    id: "role",
    label: "Team Role",
    description: "Primary job title or operational responsibility",
  },
  {
    id: "department",
    label: "Department",
  },
]

export function CsvImporterPreview() {
  const [completedRows, setCompletedRows] = React.useState<
    Record<string, unknown>[] | null
  >(null)
  const [sampleFile, setSampleFile] = React.useState<File | null>(() => {
    return new File([SAMPLE_CSV], "team-roster.csv", { type: "text/csv" })
  })

  return (
    <div className="w-full max-w-2xl space-y-4">
      {completedRows ? (
        <div className="space-y-3 rounded-lg border bg-card p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircleIcon className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Import Complete</h3>
            <p className="text-sm text-muted-foreground">
              Successfully imported {completedRows.length} clean records into
              the workspace.
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3 text-left font-mono text-xs">
            <pre>{JSON.stringify(completedRows, null, 2)}</pre>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setCompletedRows(null)
              setSampleFile(
                new File([SAMPLE_CSV], "team-roster.csv", { type: "text/csv" })
              )
            }}
          >
            Import Another CSV
          </Button>
        </div>
      ) : (
        <CsvImporter
          key={sampleFile?.name ?? "importer"}
          fields={FIELDS}
          defaultFile={sampleFile ?? undefined}
          onComplete={(rows) => setCompletedRows(rows)}
          onCancel={() => setSampleFile(null)}
        />
      )}
    </div>
  )
}
