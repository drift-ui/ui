"use client"

import * as React from "react"

import { CommentThread } from "@/registry/default/ui/comment-thread"
import type { Comment } from "@/registry/default/lib/comment-thread-utils"

const me = { id: "you", name: "Riya Kapoor" }
const noor = { id: "noor", name: "Noor Haddad" }
const tomasz = { id: "tomasz", name: "Tomasz Wierzba" }

const people = [
  { value: "noor", label: "Noor Haddad", description: "Platform" },
  { value: "tomasz", label: "Tomasz Wierzba", description: "Payments" },
  { value: "you", label: "Riya Kapoor", description: "Payments" },
]

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000)
}

function sampleComments(): Comment[] {
  return [
    {
      id: "1",
      author: noor,
      body: "Should this retry on 429 as well? The gateway rate-limits bursts after a deploy. cc @tomasz",
      createdAt: minutesAgo(180),
      reactions: [{ emoji: "👀", userIds: ["tomasz"] }],
    },
    {
      id: "2",
      parentId: "1",
      author: tomasz,
      body: "Yes, but only with the Retry-After header. Otherwise we hammer it again.",
      createdAt: minutesAgo(150),
      reactions: [{ emoji: "👍", userIds: ["noor", "you"] }],
    },
    {
      id: "3",
      parentId: "1",
      author: me,
      body: "Added that in the last commit. @noor can you take another look?",
      createdAt: minutesAgo(12),
      editedAt: minutesAgo(10),
    },
  ]
}

export function CommentThreadPreview() {
  const [comments] = React.useState(sampleComments)

  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <p className="font-mono text-xs text-muted-foreground">
        src/payments/retry.ts · line 42
      </p>
      <CommentThread
        aria-label="Review thread on retry.ts line 42"
        defaultComments={comments}
        currentUser={me}
        mentionSuggestions={people}
      />
    </div>
  )
}
