"use client"

import * as React from "react"

import {
  NotificationInbox,
  type InboxNotification,
} from "@/registry/default/ui/notification-inbox"

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60_000)
}

function sampleNotifications(): InboxNotification[] {
  return [
    {
      id: "1",
      title: "Noor Haddad requested your review on #482",
      body: "Retry failed webhooks with exponential backoff",
      createdAt: hoursAgo(0.2),
      actor: { name: "Noor Haddad" },
    },
    {
      id: "2",
      title: "Tomasz Wierzba mentioned you in Payments rollout",
      body: "@riya can you confirm the canary is holding at 5%?",
      createdAt: hoursAgo(2),
      actor: { name: "Tomasz Wierzba" },
    },
    {
      id: "3",
      title: "Deploy to production finished",
      body: "api-gateway v2.14.0 is live in all regions.",
      createdAt: hoursAgo(5),
      read: true,
    },
    {
      id: "4",
      title: "Lee Chen closed INC-219",
      body: "Elevated 5xx on checkout. Root cause: expired TLS certificate.",
      createdAt: hoursAgo(27),
      actor: { name: "Lee Chen" },
      read: true,
    },
    {
      id: "5",
      title: "Priya Nair invited you to Platform guild",
      createdAt: hoursAgo(80),
      actor: { name: "Priya Nair" },
    },
  ]
}

export function NotificationInboxPreview() {
  const [items] = React.useState(sampleNotifications)

  return <NotificationInbox defaultItems={items} />
}
