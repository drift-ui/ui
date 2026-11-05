"use client"

import * as React from "react"
import { ArchiveIcon } from "lucide-react"

import {
  NotificationInbox,
  type InboxNotification,
} from "@/registry/default/ui/notification-inbox"

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000)
}

export function NotificationInboxControlledPreview() {
  const [items, setItems] = React.useState<InboxNotification[]>(() => [
    {
      id: "build",
      title: "Build #1834 failed on main",
      body: "tests/ui/stepper.test.tsx: 2 failing",
      createdAt: minutesAgo(4),
    },
    {
      id: "invoice",
      title: "Invoice INV-0042 was paid",
      createdAt: minutesAgo(95),
    },
    {
      id: "seat",
      title: "Ana Silva accepted your invite",
      createdAt: minutesAgo(60 * 30),
      actor: { name: "Ana Silva" },
      read: true,
    },
  ])
  const [log, setLog] = React.useState("Nothing yet")

  return (
    <div className="flex flex-col items-center gap-4">
      <NotificationInbox
        items={items}
        onItemsChange={setItems}
        onMarkRead={(ids) => setLog(`Marked read: ${ids.join(", ")}`)}
        onMarkUnread={(ids) => setLog(`Marked unread: ${ids.join(", ")}`)}
        onMarkAllRead={() => setLog("Marked all as read")}
        onItemClick={(notification) => setLog(`Opened ${notification.id}`)}
        actions={[
          {
            label: "Archive",
            icon: <ArchiveIcon aria-hidden="true" className="size-3.5" />,
            onSelect: (notification) => {
              setItems((current) =>
                current.filter((item) => item.id !== notification.id)
              )
              setLog(`Archived ${notification.id}`)
            },
          },
        ]}
      />
      <p className="font-mono text-xs text-muted-foreground">{log}</p>
    </div>
  )
}
