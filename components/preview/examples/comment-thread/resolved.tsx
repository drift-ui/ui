"use client"

import * as React from "react"

import { CommentThread } from "@/registry/default/ui/comment-thread"
import type { Comment } from "@/registry/default/lib/comment-thread-utils"

const me = { id: "you", name: "Riya Kapoor" }
const sam = { id: "sam", name: "Sam Okafor" }

export function CommentThreadResolvedPreview() {
  const [comments] = React.useState<Comment[]>(() => [
    {
      id: "1",
      author: sam,
      body: "This query runs once per row. Can we batch it?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60_000),
    },
    {
      id: "2",
      parentId: "1",
      author: me,
      body: "Batched with a single IN query, down from 120 calls to 1.",
      createdAt: new Date(Date.now() - 26 * 60 * 60_000),
      reactions: [{ emoji: "🚀", userIds: ["sam"] }],
    },
  ])
  const [resolved, setResolved] = React.useState(true)
  const [resolvedBy, setResolvedBy] = React.useState<typeof me | undefined>(sam)

  return (
    <CommentThread
      className="max-w-xl"
      defaultComments={comments}
      currentUser={me}
      resolved={resolved}
      onResolvedChange={(next) => {
        setResolved(next)
        setResolvedBy(next ? me : undefined)
      }}
      resolvedBy={resolvedBy}
    />
  )
}
