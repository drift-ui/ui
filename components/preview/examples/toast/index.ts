import { ToastInboxPreview as BaseUiToastInboxPreview } from "@/components/preview/base/examples/toast/inbox"
import { ToastInboxPreview } from "@/components/preview/examples/toast/inbox"
import { ToastMergePreview as BaseUiToastMergePreview } from "@/components/preview/base/examples/toast/merge"
import { ToastMergePreview } from "@/components/preview/examples/toast/merge"
import { ToastProgressPreview as BaseUiToastProgressPreview } from "@/components/preview/base/examples/toast/progress"
import { ToastProgressPreview } from "@/components/preview/examples/toast/progress"
import { ToastPromisePreview as BaseUiToastPromisePreview } from "@/components/preview/base/examples/toast/promise"
import { ToastPromisePreview } from "@/components/preview/examples/toast/promise"
import { ToastReadingTimePreview as BaseUiToastReadingTimePreview } from "@/components/preview/base/examples/toast/reading-time"
import { ToastReadingTimePreview } from "@/components/preview/examples/toast/reading-time"
import { ToastTypesPreview as BaseUiToastTypesPreview } from "@/components/preview/base/examples/toast/types"
import { ToastTypesPreview } from "@/components/preview/examples/toast/types"
import { ToastUndoPreview as BaseUiToastUndoPreview } from "@/components/preview/base/examples/toast/undo"
import { ToastUndoPreview } from "@/components/preview/examples/toast/undo"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "undo",
    title: "Undo instead of confirm",
    description:
      "Archive or delete a conversation and it leaves the list at once. The real action waits in onCommit, which runs when the toast times out, is swiped away or closed, or the page unloads. Undo, or ⌘Z on a Mac and Ctrl+Z elsewhere, restores it, and onCommit never runs. Hover or focus the toasts to pause the countdown.",
    Preview: ToastUndoPreview,
    BasePreview: BaseUiToastUndoPreview,
  },
  {
    id: "types",
    title: "Types and actions",
    description:
      "Each type gets its own icon color from the theme. Errors are announced assertively, and an action gives the reader something to do next.",
    Preview: ToastTypesPreview,
    BasePreview: BaseUiToastTypesPreview,
  },
  {
    id: "promise",
    title: "Follow a promise",
    description:
      "One toast moves from loading to success or error as the promise settles. The production deploy fails on purpose.",
    Preview: ToastPromisePreview,
    BasePreview: BaseUiToastPromisePreview,
  },
  {
    id: "progress",
    title: "Upload progress",
    description:
      "toast.progress shows a determinate bar and stays up until you replace it. Call it again with the same id to move the bar, then swap in a success toast with that id.",
    Preview: ToastProgressPreview,
    BasePreview: BaseUiToastProgressPreview,
  },
  {
    id: "merge",
    title: "Merge repeated toasts",
    description:
      "Toasts that share an id (a key on Base UI) merge into one with a count, and the timer restarts on every repeat.",
    Preview: ToastMergePreview,
    BasePreview: BaseUiToastMergePreview,
  },
  {
    id: "reading-time",
    title: "Time to read",
    description:
      "Without a duration, a toast stays up longer the more text it has and never less than the Toaster default, so a long error does not vanish mid-sentence.",
    Preview: ToastReadingTimePreview,
    BasePreview: BaseUiToastReadingTimePreview,
  },
  {
    id: "inbox",
    title: "Keep it in the inbox",
    description:
      "Toasts with persist land in the notification inbox when they close. onToastPersist hands you an InboxNotification to add to the list.",
    Preview: ToastInboxPreview,
    BasePreview: BaseUiToastInboxPreview,
  },
]
