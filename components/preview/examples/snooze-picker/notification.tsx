"use client"

import * as React from "react"
import { BellOffIcon } from "lucide-react"

import { Card } from "@/registry/default/ui/card"
import { SnoozePicker } from "@/registry/default/ui/snooze-picker"

export function SnoozePickerNotificationPreview() {
  const [snoozedAt, setSnoozedAt] = React.useState<Date | null>(null)

  return (
    <Card className="flex w-full max-w-md items-center justify-between p-4">
      <div className="space-y-1">
        <p className="text-sm leading-none font-medium">
          Security alert review
        </p>
        <p className="text-xs text-muted-foreground">
          {snoozedAt
            ? `Snoozed until ${snoozedAt.toLocaleDateString(undefined, {
                weekday: "short",
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
