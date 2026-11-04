import type { MentionOption } from "@/registry/default/lib/mention"

export type CommentAuthor = {
  id: string
  name: string
  avatarUrl?: string
}

export type CommentReaction = {
  emoji: string
  userIds: string[]
}

export type Comment = {
  id: string
  parentId?: string | null
  author: CommentAuthor
  body: string
  createdAt: Date | string
  editedAt?: Date | string
  deleted?: boolean
  reactions?: CommentReaction[]
}

export type CommentNode = {
  comment: Comment
  replies: Comment[]
}

export type ReactionOption = {
  emoji: string
  label: string
}

export type BodySegment =
  | { type: "text"; text: string }
  | { type: "mention"; text: string; option: MentionOption }

export const QUICK_REACTIONS: ReactionOption[] = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "👎", label: "Thumbs down" },
  { emoji: "😄", label: "Laugh" },
  { emoji: "🎉", label: "Hooray" },
  { emoji: "😕", label: "Confused" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "👀", label: "Eyes" },
]

export function toDate(value: Date | string | undefined | null) {
  if (value === undefined || value === null || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function rootIdOf(comment: Comment, byId: Map<string, Comment>) {
  const visited = new Set<string>([comment.id])
  let current = comment
  while (current.parentId) {
    const parent = byId.get(current.parentId)
    if (!parent) break
    if (visited.has(parent.id)) return comment.id
    visited.add(parent.id)
    current = parent
  }
  return current.id
}

export function buildThread(comments: Comment[]): CommentNode[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]))
  const nodes = new Map<string, CommentNode>()

  for (const comment of comments) {
    const rootId = rootIdOf(comment, byId)
    if (rootId === comment.id) {
      nodes.set(comment.id, {
        comment,
        replies: nodes.get(comment.id)?.replies ?? [],
      })
      continue
    }
    if (comment.deleted) continue
    const root = nodes.get(rootId)
    if (root) root.replies.push(comment)
    else nodes.set(rootId, { comment: byId.get(rootId)!, replies: [comment] })
  }

  const ordered = comments
    .filter((comment) => nodes.has(comment.id))
    .map((comment) => nodes.get(comment.id)!)
  return ordered.filter(
    (node) => !node.comment.deleted || node.replies.length > 0
  )
}

export function countVisible(nodes: CommentNode[]) {
  return nodes.reduce(
    (total, node) =>
      total + (node.comment.deleted ? 0 : 1) + node.replies.length,
    0
  )
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function mentionPattern(options: MentionOption[]) {
  const values = [...new Set(options.map((option) => option.value))]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
  if (values.length === 0) return null
  return new RegExp(
    `(^|[\\s(\\[])@(${values.join("|")})(?=$|[\\s.,!?;:)\\]'"])`,
    "g"
  )
}

export function parseBody(
  body: string,
  options: MentionOption[] = []
): BodySegment[] {
  const pattern = mentionPattern(options)
  if (!pattern) return body ? [{ type: "text", text: body }] : []

  const byValue = new Map(options.map((option) => [option.value, option]))
  const segments: BodySegment[] = []
  let cursor = 0

  for (const match of body.matchAll(pattern)) {
    const start = match.index + match[1].length
    if (start > cursor) {
      segments.push({ type: "text", text: body.slice(cursor, start) })
    }
    segments.push({
      type: "mention",
      text: `@${match[2]}`,
      option: byValue.get(match[2])!,
    })
    cursor = start + match[2].length + 1
  }

  if (cursor < body.length) {
    segments.push({ type: "text", text: body.slice(cursor) })
  }
  return segments
}

export function extractMentions(body: string, options: MentionOption[] = []) {
  const values = parseBody(body, options).flatMap((segment) =>
    segment.type === "mention" ? [segment.option.value] : []
  )
  return [...new Set(values)]
}

export function addComment(comments: Comment[], comment: Comment) {
  return [...comments, comment]
}

export function editComment(
  comments: Comment[],
  id: string,
  body: string,
  editedAt: Date
) {
  return comments.map((comment) =>
    comment.id === id ? { ...comment, body, editedAt } : comment
  )
}

export function deleteComment(comments: Comment[], id: string): Comment[] {
  const target = comments.find((comment) => comment.id === id)
  if (!target) return comments

  const hasReplies = comments.some(
    (comment) => comment.parentId === id && !comment.deleted
  )
  if (hasReplies) {
    return comments.map((comment) =>
      comment.id === id
        ? { ...comment, body: "", deleted: true, reactions: [] }
        : comment
    )
  }

  const remaining = comments.filter((comment) => comment.id !== id)
  const parent = target.parentId
    ? remaining.find((comment) => comment.id === target.parentId)
    : undefined
  const parentIsEmpty =
    parent?.deleted &&
    !remaining.some(
      (comment) => comment.parentId === parent.id && !comment.deleted
    )
  return parentIsEmpty
    ? remaining.filter((comment) => comment.id !== parent.id)
    : remaining
}

export function toggleReaction(
  comments: Comment[],
  id: string,
  emoji: string,
  userId: string
) {
  return comments.map((comment) => {
    if (comment.id !== id) return comment
    const reactions = comment.reactions ?? []
    const existing = reactions.find((reaction) => reaction.emoji === emoji)
    if (!existing) {
      return {
        ...comment,
        reactions: [...reactions, { emoji, userIds: [userId] }],
      }
    }
    const userIds = existing.userIds.includes(userId)
      ? existing.userIds.filter((user) => user !== userId)
      : [...existing.userIds, userId]
    return {
      ...comment,
      reactions: reactions.flatMap((reaction) =>
        reaction !== existing
          ? [reaction]
          : userIds.length > 0
            ? [{ ...reaction, userIds }]
            : []
      ),
    }
  })
}

export function hasReacted(
  reaction: CommentReaction,
  userId: string | undefined
) {
  return userId !== undefined && reaction.userIds.includes(userId)
}

export function describeReactors(
  userIds: string[],
  names: Map<string, string>,
  currentUserId?: string,
  locale?: string
) {
  const unique = [...new Set(userIds)]
  const named: string[] = []
  let others = 0
  if (currentUserId && unique.includes(currentUserId)) named.push("You")
  for (const id of unique) {
    if (id === currentUserId) continue
    const name = names.get(id)
    if (name && named.length < 3) named.push(name)
    else others += 1
  }
  if (others > 0) named.push(others === 1 ? "1 other" : `${others} others`)
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(named)
}

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  const letters =
    words.length === 1
      ? [...words[0]].slice(0, 2)
      : [[...words[0]][0], [...words[words.length - 1]][0]]
  return letters.join("").toUpperCase()
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

export function formatRelativeTime(date: Date, now: Date, locale?: string) {
  const seconds = (date.getTime() - now.getTime()) / 1000
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return format.format(Math.trunc(seconds / size), unit)
    }
  }
  return format.format(0, "second")
}

export function formatAbsoluteTime(date: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
