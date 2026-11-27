"use client"

import * as React from "react"
import { RocketIcon } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { toast } from "@/registry/default/ui/sonner"

type Environment = "staging" | "production"

function deploy(environment: Environment) {
  return new Promise<{ commit: string }>((resolve, reject) =>
    setTimeout(
      () =>
        environment === "staging"
          ? resolve({ commit: "a1f9c2e" })
          : reject(new Error("DATABASE_URL is missing in production.")),
      1800
    )
  )
}

export function ToastPromisePreview() {
  const [status, setStatus] = React.useState("Idle")

  function start(environment: Environment) {
    setStatus(`Deploying to ${environment}`)
    toast.promise(deploy(environment), {
      loading: `Deploying to ${environment}`,
      success: ({ commit }) => {
        setStatus(`Live on ${environment}`)
        return `Deployed ${commit} to ${environment}`
      },
      error: (error: Error) => {
        setStatus("Failed")
        return `Deploy failed. ${error.message}`
      },
    })
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-box border p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">acme-web</p>
          <p className="text-muted-foreground">main · a1f9c2e</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => start("staging")}>
          <RocketIcon />
          Deploy to staging
        </Button>
        <Button variant="outline" onClick={() => start("production")}>
          Deploy to production
        </Button>
      </div>
    </div>
  )
}
