"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { Label } from "@/registry/default/ui/label"
import { UnitInput } from "@/registry/default/ui/unit-input"

export function UnitInputFormPreview() {
  const [submitted, setSubmitted] = React.useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(String(new FormData(event.currentTarget).get("upload_cap")))
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-64 flex-col gap-2">
      <Label htmlFor="form-upload-cap">Upload cap</Label>
      <UnitInput
        id="form-upload-cap"
        name="upload_cap"
        defaultValue={25_000_000}
      />
      <Button type="submit" className="mt-1">
        Save
      </Button>
      {submitted !== null && (
        <p className="font-mono text-xs text-muted-foreground">
          upload_cap={submitted}
        </p>
      )}
    </form>
  )
}
