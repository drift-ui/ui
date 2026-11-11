"use client"

import * as React from "react"

import { CommentThread } from "@/registry/default/ui/comment-thread"
import type { Comment } from "@/registry/default/lib/comment-thread-utils"

const lee = { id: "lee", name: "Lee Chen" }
const priya = { id: "priya", name: "Priya Nair" }

export function CommentThreadReadOnlyPreview() {
  const [comments] = React.useState<Comment[]>(() => [
    {
      id: "1",
      author: lee,
      body: "Signed off on the rollout plan. @priya owns the canary.",
      createdAt: new Date(Date.now() - 5 * 60 * 60_000),
      reactions: [{ emoji: "🎉", userIds: ["priya", "sam", "ana"] }],
    },
    {
      id: "2",
      parentId: "1",
      author: priya,
      body: "Canary is at 5% and holding.",
      createdAt: new Date(Date.now() - 3 * 60 * 60_000),
    },
  ])

  return (
    <CommentThread
      className="max-w-xl"
      aria-label="Rollout discussion"
      defaultComments={comments}
      mentionSuggestions={[{ value: "priya", label: "Priya Nair" }]}
    />
  )
}
