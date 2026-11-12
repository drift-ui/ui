"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  NotificationInbox,
  type InboxNotification,
} from "@/registry/default/ui/notification-inbox"
import { onToastPersist, toast } from "@/registry/default/ui/sonner"

const EVENTS = [
  {
    title: "Ana Silva commented on Q3 roadmap",
    description: "Can we move the launch to the 14th?",
  },
  {
    title: "Build #1835 passed on main",
    description: "All 412 tests passed in 3m 12s.",
  },
  { title: "Invoice 0413 was paid", description: "$860.00 from Northwind." },
]

export function ToastInboxPreview() {
  const [items, setItems] = React.useState<InboxNotification[]>([])

  React.useEffect(
    () =>
      onToastPersist((notification) =>
        setItems((current) => [notification, ...current])
      ),
    []
  )

  return (
    <div className="flex w-full max-w-md flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {EVENTS.map((event, index) => (
          <Button
            key={event.title}
            variant="outline"
            size="sm"
            onClick={() =>
              toast(event.title, {
                description: event.description,
                persist: true,
              })
            }
          >
            Event {index + 1}
          </Button>
        ))}
      </div>
      <NotificationInbox
        aria-label="Notifications"
        items={items}
        onItemsChange={setItems}
      />
    </div>
  )
}
