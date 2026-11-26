"use client"

import * as React from "react"
import { BellOffIcon } from "lucide-react"

import { Card } from "@/registry/default/ui/card"
import { SnoozePicker } from "@/registry/default/ui/snooze-picker"

export function SnoozePickerNotificationPreview() {
  const [snoozedAt, setSnoozedAt] = React.useState<Date | null>(null)

  return (
    <Card className="w-full max-w-md flex-row items-center justify-between gap-4 p-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm leading-none font-medium">
          Security alert review
        </p>
        <p className="text-xs text-muted-foreground">
          {snoozedAt
            ? `Snoozed until ${snoozedAt.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "Production database replica CPU high"}
        </p>
      </div>

      <SnoozePicker
        value={snoozedAt}
        onValueChange={setSnoozedAt}
        size="icon"
        variant="ghost"
        aria-label="Snooze alert"
      >
        <BellOffIcon className="size-4" />
      </SnoozePicker>
    </Card>
  )
}
