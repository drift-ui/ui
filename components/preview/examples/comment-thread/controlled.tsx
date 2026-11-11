"use client"

import * as React from "react"

import { CommentThread } from "@/registry/default/ui/comment-thread"
import type { Comment } from "@/registry/default/lib/comment-thread-utils"

const me = { id: "you", name: "Riya Kapoor" }
const ana = { id: "ana", name: "Ana Lima" }

function save() {
  return new Promise<void>((resolve) => setTimeout(resolve, 600))
}

export function CommentThreadControlledPreview() {
  const [comments, setComments] = React.useState<Comment[]>(() => [
    {
      id: "1",
      author: ana,
      body: "The empty state copy still says “projects”. Should it be “workspaces”?",
      createdAt: new Date(Date.now() - 45 * 60_000),
    },
  ])
  const [log, setLog] = React.useState<string[]>([])

  async function persist(action: string) {
    await save()
    setLog((previous) => [action, ...previous].slice(0, 3))
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <CommentThread
        comments={comments}
        onCommentsChange={setComments}
        currentUser={me}
        onReply={(parentId) =>
          persist(parentId ? "Saved reply" : "Saved comment")
        }
        onEdit={() => persist("Saved edit")}
        onDelete={() => persist("Deleted comment")}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {comments.length} stored · {log[0] ?? "Nothing saved yet"}
      </p>
    </div>
  )
}
