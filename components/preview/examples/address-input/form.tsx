"use client"

import * as React from "react"

import { AddressInput } from "@/registry/default/ui/address-input"
import { Button } from "@/registry/default/ui/button"

export function AddressInputFormPreview() {
  const [submitted, setSubmitted] = React.useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const entries = Object.fromEntries(new FormData(event.currentTarget))
    setSubmitted(JSON.stringify(entries, null, 2))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3"
    >
      <AddressInput
        aria-label="Billing address"
        name="billing"
        addressType="billing"
        defaultCountry="DE"
      />
      <Button type="submit" className="self-start">
        Save address
      </Button>
      {submitted && (
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
          {submitted}
        </pre>
      )}
    </form>
  )
}
