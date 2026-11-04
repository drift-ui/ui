import { ArrowUpRightIcon } from "lucide-react"

import { siteConfig } from "@/lib/site-config"
import { cn } from "@/registry/default/lib/utils"
import { buttonVariants } from "@/registry/default/ui/button"

export function componentRequestUrl(name = "") {
  const params = new URLSearchParams({ template: "component_request.yml" })
  const component = name.trim().slice(0, 80)
  if (component) params.set("component", component)
  return `${siteConfig.repo}/issues/new?${params}`
}

export function RequestComponentLink({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  return (
    <a
      href={componentRequestUrl(name)}
      target="_blank"
      rel="noreferrer"
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "active:scale-[0.98]",
        className
      )}
    >
      Request a component
      <ArrowUpRightIcon aria-hidden />
      <span className="sr-only">(opens GitHub in a new tab)</span>
    </a>
  )
}

export function RequestComponentCallout() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[1.75rem] border border-dashed px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="font-medium">Don&apos;t see the component you need?</p>
        <p className="max-w-[52ch] text-sm text-muted-foreground">
          Open a request on GitHub with the screen you need it for and any
          library that already does it well.
        </p>
      </div>
      <RequestComponentLink className="border bg-card" />
    </div>
  )
}
