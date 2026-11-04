import { CommentThreadControlledPreview } from "@/components/preview/examples/comment-thread/controlled"
import { CommentThreadReadOnlyPreview } from "@/components/preview/examples/comment-thread/read-only"
import { CommentThreadResolvedPreview } from "@/components/preview/examples/comment-thread/resolved"
import type { ComponentExample } from "@/lib/component-docs"

export const examples: ComponentExample[] = [
  {
    id: "controlled",
    title: "Controlled with async saves",
    description:
      "Own the comments array and return a promise from onReply, onEdit or onDelete. The thread waits for it and keeps the draft if it rejects.",
    Preview: CommentThreadControlledPreview,
  },
  {
    id: "resolved",
    title: "Resolved thread",
    description:
      "A resolved thread collapses to a summary row with Show thread and Reopen.",
    Preview: CommentThreadResolvedPreview,
  },
  {
    id: "read-only",
    title: "Read-only",
    description:
      "Leave out currentUser to show the thread without a composer, actions or reaction toggles.",
    Preview: CommentThreadReadOnlyPreview,
  },
]
