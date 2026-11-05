"use client"

import * as React from "react"
import { GitPullRequestIcon, RocketIcon, TriangleAlertIcon } from "lucide-react"

import {
  NotificationInbox,
  NotificationItem,
  type InboxNotification,
} from "@/registry/default/ui/notification-inbox"

type DeployNotification = InboxNotification & {
  kind: "deploy" | "review" | "alert"
}

const ICONS = {
  deploy: RocketIcon,
  review: GitPullRequestIcon,
  alert: TriangleAlertIcon,
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60_000)
}

export function NotificationInboxCustomItemPreview() {
  const [items] = React.useState<DeployNotification[]>(() => [
    {
      id: "alert",
      kind: "alert",
      title: "p95 latency above 800ms on checkout",
      createdAt: hoursAgo(0.5),
    },
    {
      id: "review",
      kind: "review",
      title: "Review requested on #491",
      body: "Add a Base UI version of the tour spotlight",
      createdAt: hoursAgo(3),
    },
    {
      id: "deploy",
      kind: "deploy",
      title: "web v4.2.0 deployed",
      createdAt: hoursAgo(26),
      read: true,
    },
  ])

  return (
    <NotificationInbox
      aria-label="Activity"
      defaultItems={items}
      renderItem={(notification) => {
        const Icon = ICONS[notification.kind]
        return (
          <span className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <NotificationItem {...notification} />
          </span>
        )
      }}
    />
  )
}
