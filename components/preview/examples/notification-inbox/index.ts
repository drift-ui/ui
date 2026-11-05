import { NotificationInboxControlledPreview } from "@/components/preview/examples/notification-inbox/controlled"
import { NotificationInboxCustomItemPreview } from "@/components/preview/examples/notification-inbox/custom-item"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "controlled",
    title: "Controlled with actions",
    description:
      "Own the items array, sync read state with onMarkRead, onMarkUnread and onMarkAllRead, and add per-item actions such as Archive.",
    Preview: NotificationInboxControlledPreview,
  },
  {
    id: "custom-item",
    title: "Custom item",
    description:
      "renderItem replaces the content of each row. Extra fields on your items reach it typed, and NotificationItem renders the default title, body and time.",
    Preview: NotificationInboxCustomItemPreview,
  },
]
