"use client"

import * as React from "react"
import {
  CircleCheckIcon,
  PencilIcon,
  ReplyIcon,
  SmilePlusIcon,
  Trash2Icon,
} from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  addComment,
  buildThread,
  countVisible,
  deleteComment,
  describeReactors,
  editComment,
  extractMentions,
  formatAbsoluteTime,
  formatRelativeTime,
  hasReacted,
  initialsOf,
  parseBody,
  QUICK_REACTIONS,
  toDate,
  toggleReaction,
  type Comment,
  type CommentAuthor,
  type ReactionOption,
} from "@/registry/default/lib/comment-thread"
import type { MentionOption } from "@/registry/default/lib/mention"
import { cn } from "@/registry/default/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"
import { Button } from "@/registry/default/ui/button"
import { MentionTextarea } from "@/registry/default/ui/mention-textarea"

type MaybePromise = void | Promise<void>

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `comment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  )
}

function useNow(override: Date | undefined) {
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => {
    if (override) return
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [override])
  return override ?? now
}

function useLatest<T>(value: T) {
  const ref = React.useRef(value)
  React.useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}

function pluralize(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function CommentAvatar({
  author,
  size,
}: {
  author: CommentAuthor
  size: "default" | "sm"
}) {
  return (
    <Avatar className={size === "sm" ? "size-6" : "size-8"}>
      {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt="" />}
      <AvatarFallback
        className={cn("font-medium", size === "sm" ? "text-[10px]" : "text-xs")}
      >
        {initialsOf(author.name)}
      </AvatarFallback>
    </Avatar>
  )
}

function CommentComposer({
  label,
  placeholder,
  submitLabel,
  defaultValue = "",
  suggestions,
  failureMessage,
  autoFocus,
  focusKey,
  actions,
  author,
  avatarSize = "default",
  onSubmit,
  onCancel,
}: {
  label: string
  placeholder: string
  submitLabel: string
  defaultValue?: string
  suggestions: MentionOption[]
  failureMessage: string
  autoFocus?: boolean
  focusKey: string
  actions?: React.ReactNode
  author?: CommentAuthor
  avatarSize?: "default" | "sm"
  onSubmit: (body: string) => MaybePromise
  onCancel?: () => void
}) {
  const errorId = React.useId()
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [draft, setDraft] = React.useState(defaultValue)
  const [hasFailed, setHasFailed] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const isBlank = draft.trim() === ""

  React.useEffect(() => {
    if (!autoFocus) return
    const textarea = wrapperRef.current?.querySelector("textarea")
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [autoFocus])

  function submit() {
    if (isBlank || isPending) return
    const body = draft.trim()
    setHasFailed(false)
    startTransition(async () => {
      try {
        await onSubmit(body)
        setDraft("")
      } catch {
        setHasFailed(true)
      }
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.currentTarget.hasAttribute("aria-controls")) return
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    } else if (event.key === "Escape" && onCancel && !isPending) {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      ref={wrapperRef}
      data-slot="comment-thread-composer"
      className={cn(
        "grid gap-x-3",
        author ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1"
      )}
    >
      {author && (
        <div aria-hidden>
          <CommentAvatar author={author} size={avatarSize} />
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-2">
        <MentionTextarea
          data-focus-key={focusKey}
          aria-label={label}
          aria-invalid={hasFailed || undefined}
          aria-describedby={hasFailed ? errorId : undefined}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          placeholder={placeholder}
          value={draft}
          onValueChange={setDraft}
          readOnly={isPending}
          triggers={suggestions.length > 0 ? { "@": suggestions } : {}}
          onKeyDown={handleKeyDown}
          className="min-h-20 bg-background aria-invalid:border-destructive aria-invalid:ring-destructive/20"
        />
        {hasFailed && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {failureMessage}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <div className="ml-auto flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={isBlank || isPending}
              aria-busy={isPending || undefined}
              onClick={submit}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReactionPicker({
  id,
  commentId,
  options,
  reacted,
  onPick,
  onClose,
  onDismiss,
}: {
  id: string
  commentId: string
  options: ReactionOption[]
  reacted: Set<string>
  onPick: (emoji: string) => void
  onClose: () => void
  onDismiss: () => void
}) {
  const groupRef = React.useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const latestDismiss = useLatest(onDismiss)
  const toggleSelector = `[data-focus-key="react:${commentId}"]`

  const isInside = React.useCallback(
    (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false
      if (groupRef.current?.contains(target)) return true
      return (
        target instanceof Element && target.closest(toggleSelector) !== null
      )
    },
    [toggleSelector]
  )

  React.useEffect(() => {
    groupRef.current?.querySelector("button")?.focus()
  }, [])

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!isInside(event.target)) latestDismiss.current()
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [isInside, latestDismiss])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const buttons = [
      ...(groupRef.current?.querySelectorAll("button") ?? []),
    ] as HTMLButtonElement[]
    const index = buttons.indexOf(event.target as HTMLButtonElement)
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: buttons.length - 1,
    }
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
    } else if (event.key in moves && index !== -1) {
      event.preventDefault()
      const next = (moves[event.key] + buttons.length) % buttons.length
      buttons[next]?.focus()
    }
  }

  return (
    <div
      ref={groupRef}
      id={id}
      role="group"
      aria-label="Pick a reaction"
      data-slot="comment-thread-reaction-picker"
      data-comment-id={commentId}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (event.relatedTarget && !isInside(event.relatedTarget)) onDismiss()
      }}
      className="absolute right-0 bottom-full z-20 mb-1 flex w-max gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {options.map((option, index) => (
        <button
          key={option.emoji}
          type="button"
          tabIndex={index === activeIndex ? 0 : -1}
          onFocus={() => setActiveIndex(index)}
          aria-label={option.label}
          aria-pressed={reacted.has(option.emoji)}
          title={option.label}
          onClick={() => onPick(option.emoji)}
          className="flex size-8 items-center justify-center rounded-md text-base outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-accent"
        >
          {option.emoji}
        </button>
      ))}
    </div>
  )
}

function CommentBody({
  body,
  suggestions,
}: {
  body: string
  suggestions: MentionOption[]
}) {
  return (
    <p
      data-slot="comment-thread-body"
      className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
    >
      {parseBody(body, suggestions).map((segment, index) =>
        segment.type === "mention" ? (
          <span
            key={index}
            data-slot="comment-thread-mention"
            title={segment.option.label}
            className="rounded-sm bg-primary/10 px-0.5 font-medium text-primary"
          >
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      )}
    </p>
  )
}

const actionButtonClassName =
  "size-7 text-muted-foreground hover:text-foreground"

function CommentThread({
  comments,
  defaultComments = [],
  onCommentsChange,
  currentUser,
  mentionSuggestions = [],
  reactions = QUICK_REACTIONS,
  resolved,
  defaultResolved = false,
  onResolvedChange,
  resolvedBy,
  onReply,
  onEdit,
  onDelete,
  onReactionToggle,
  now: nowOverride,
  locale,
  className,
  "aria-label": ariaLabel = "Comment thread",
  ...props
}: Omit<React.ComponentProps<"section">, "children"> & {
  comments?: Comment[]
  defaultComments?: Comment[]
  onCommentsChange?: (comments: Comment[]) => void
  currentUser?: CommentAuthor
  mentionSuggestions?: MentionOption[]
  reactions?: ReactionOption[]
  resolved?: boolean
  defaultResolved?: boolean
  onResolvedChange?: (resolved: boolean) => void
  resolvedBy?: CommentAuthor
  onReply?: (
    parentId: string | null,
    body: string,
    mentions: string[]
  ) => MaybePromise
  onEdit?: (id: string, body: string, mentions: string[]) => MaybePromise
  onDelete?: (id: string) => MaybePromise
  onReactionToggle?: (id: string, emoji: string) => void
  now?: Date
  locale?: string
}) {
  const id = React.useId()
  const rootRef = React.useRef<HTMLElement>(null)
  const { value: list, setValue: setList } = useControllableState({
    value: comments,
    defaultValue: defaultComments,
    onChange: onCommentsChange,
  })
  const latestList = useLatest(list)
  const { value: isResolved, setValue: setIsResolved } = useControllableState({
    value: resolved,
    defaultValue: defaultResolved,
    onChange: onResolvedChange,
  })
  const [resolver, setResolver] = React.useState<CommentAuthor>()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [reply, setReply] = React.useState<{
    rootId: string
    originId: string
    prefill: string
  } | null>(null)
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null)
  const [deleteFailedId, setDeleteFailedId] = React.useState<string | null>(
    null
  )
  const [pickerId, setPickerId] = React.useState<string | null>(null)
  const pendingFocusRef = React.useRef<string[] | null>(null)
  const [announcement, setAnnouncement] = React.useState("")
  const [isDeleting, startDeleting] = React.useTransition()
  const now = useNow(nowOverride)

  const nodes = buildThread(list)
  const visibleCount = countVisible(nodes)
  const order = nodes.flatMap((node) => [
    node.comment.id,
    ...node.replies.map((comment) => comment.id),
  ])
  const names = new Map<string, string>()
  for (const comment of list) names.set(comment.author.id, comment.author.name)
  if (currentUser) names.set(currentUser.id, currentUser.name)
  const reactionLabels = new Map(
    reactions.map((option) => [option.emoji, option.label])
  )
  const showBody = !isResolved || isExpanded
  const canWrite = currentUser !== undefined
  const resolvedByAuthor = resolvedBy ?? resolver

  React.useEffect(() => {
    const keys = pendingFocusRef.current
    if (!keys) return
    pendingFocusRef.current = null
    const targets = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>("[data-focus-key]") ??
        []),
    ]
    for (const key of keys) {
      const target = targets.find((element) => element.dataset.focusKey === key)
      if (target) {
        target.focus()
        return
      }
    }
  })

  function focusAfterRender(keys: string[]) {
    pendingFocusRef.current = keys
  }

  function isOwn(comment: Comment) {
    return currentUser !== undefined && comment.author.id === currentUser.id
  }

  async function postComment(parentId: string | null, body: string) {
    if (!currentUser) return
    await onReply?.(parentId, body, extractMentions(body, mentionSuggestions))
    setList(
      addComment(latestList.current, {
        id: createId(),
        parentId,
        author: currentUser,
        body,
        createdAt: new Date(),
      })
    )
    setAnnouncement(parentId ? "Reply posted" : "Comment posted")
  }

  function startReply(comment: Comment, rootId: string) {
    const option =
      comment.id !== rootId && !isOwn(comment)
        ? mentionSuggestions.find((item) => item.value === comment.author.id)
        : undefined
    setReply({
      rootId,
      originId: comment.id,
      prefill: option ? `@${option.value} ` : "",
    })
  }

  function closeReply() {
    if (reply) focusAfterRender([`reply:${reply.originId}`])
    setReply(null)
  }

  async function saveEdit(comment: Comment, body: string) {
    if (!isOwn(comment)) return
    if (body !== comment.body.trim()) {
      await onEdit?.(
        comment.id,
        body,
        extractMentions(body, mentionSuggestions)
      )
      setList(editComment(latestList.current, comment.id, body, new Date()))
      setAnnouncement("Comment updated")
    }
    setEditingId(null)
    focusAfterRender([`edit:${comment.id}`])
  }

  function cancelEdit(comment: Comment) {
    setEditingId(null)
    focusAfterRender([`edit:${comment.id}`])
  }

  function confirmDelete(comment: Comment) {
    if (!isOwn(comment) || isDeleting) return
    const index = order.indexOf(comment.id)
    const fallbacks = [
      `comment:${comment.id}`,
      `comment:${order[index + 1]}`,
      `comment:${order[index - 1]}`,
      "composer",
    ]
    setDeleteFailedId(null)
    startDeleting(async () => {
      try {
        await onDelete?.(comment.id)
        setList(deleteComment(latestList.current, comment.id))
        setConfirmingId(null)
        setAnnouncement("Comment deleted")
        focusAfterRender(fallbacks)
      } catch {
        setDeleteFailedId(comment.id)
      }
    })
  }

  function react(comment: Comment, emoji: string) {
    if (!currentUser || comment.deleted) return
    setList(toggleReaction(list, comment.id, emoji, currentUser.id))
    onReactionToggle?.(comment.id, emoji)
  }

  function setThreadResolved(next: boolean) {
    if (!canWrite) return
    setIsResolved(next)
    setResolver(next ? currentUser : undefined)
    setIsExpanded(false)
    setEditingId(null)
    setReply(null)
    setConfirmingId(null)
    setPickerId(null)
    setAnnouncement(next ? "Thread resolved" : "Thread reopened")
    focusAfterRender(next ? ["toggle-thread"] : ["resolve"])
  }

  function renderComment(comment: Comment, rootId: string, isReply: boolean) {
    const nameId = `${id}-${comment.id}-name`
    const timeId = `${id}-${comment.id}-time`
    const pickerDomId = `${id}-${comment.id}-reactions`
    const createdAt = toDate(comment.createdAt)
    const editedAt = toDate(comment.editedAt)
    const isEditing = editingId === comment.id
    const isConfirming = confirmingId === comment.id
    const isPickerOpen = pickerId === comment.id
    const own = isOwn(comment)
    const reacted = new Set(
      (comment.reactions ?? [])
        .filter((reaction) => hasReacted(reaction, currentUser?.id))
        .map((reaction) => reaction.emoji)
    )

    if (comment.deleted) {
      return (
        <article
          data-slot="comment-thread-comment"
          data-deleted=""
          data-focus-key={`comment:${comment.id}`}
          tabIndex={-1}
          aria-label="Deleted comment"
          className="grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className={cn(
              "rounded-full border border-dashed",
              isReply ? "size-6" : "size-8"
            )}
          />
          <p className="text-sm text-muted-foreground italic">
            This comment was deleted.
          </p>
        </article>
      )
    }

    return (
      <article
        data-slot="comment-thread-comment"
        data-focus-key={`comment:${comment.id}`}
        tabIndex={-1}
        aria-labelledby={createdAt ? `${nameId} ${timeId}` : nameId}
        className="group/comment grid grid-cols-[auto_1fr] gap-x-3 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <CommentAvatar
          author={comment.author}
          size={isReply ? "sm" : "default"}
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <header className="flex min-h-7 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span id={nameId} className="text-sm font-medium">
                {comment.author.name}
              </span>
              {createdAt && (
                <time
                  id={timeId}
                  dateTime={createdAt.toISOString()}
                  title={formatAbsoluteTime(createdAt, locale)}
                  suppressHydrationWarning
                  className="text-xs text-muted-foreground"
                >
                  {formatRelativeTime(createdAt, now, locale)}
                </time>
              )}
              {editedAt && (
                <span
                  title={`Edited ${formatAbsoluteTime(editedAt, locale)}`}
                  suppressHydrationWarning
                  className="text-xs text-muted-foreground"
                >
                  (edited)
                </span>
              )}
            </div>
            {canWrite && !isEditing && !isConfirming && (
              <div
                role="group"
                aria-label="Comment actions"
                data-open={isPickerOpen || undefined}
                className="relative flex shrink-0 items-center opacity-0 transition-opacity group-focus-within/comment:opacity-100 group-hover/comment:opacity-100 data-open:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-focus-key={`react:${comment.id}`}
                  aria-label="Add reaction"
                  aria-expanded={isPickerOpen}
                  aria-controls={isPickerOpen ? pickerDomId : undefined}
                  title="Add reaction"
                  onClick={() => setPickerId(isPickerOpen ? null : comment.id)}
                  className={actionButtonClassName}
                >
                  <SmilePlusIcon />
                </Button>
                {isPickerOpen && (
                  <ReactionPicker
                    id={pickerDomId}
                    commentId={comment.id}
                    options={reactions}
                    reacted={reacted}
                    onPick={(emoji) => {
                      react(comment, emoji)
                      setPickerId(null)
                      focusAfterRender([`react:${comment.id}`])
                    }}
                    onClose={() => {
                      setPickerId(null)
                      focusAfterRender([`react:${comment.id}`])
                    }}
                    onDismiss={() => setPickerId(null)}
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-focus-key={`reply:${comment.id}`}
                  aria-label={`Reply to ${comment.author.name}`}
                  title="Reply"
                  onClick={() => startReply(comment, rootId)}
                  className={actionButtonClassName}
                >
                  <ReplyIcon />
                </Button>
                {own && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-focus-key={`edit:${comment.id}`}
                      aria-label="Edit comment"
                      title="Edit"
                      onClick={() => {
                        setEditingId(comment.id)
                        setPickerId(null)
                      }}
                      className={actionButtonClassName}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-focus-key={`delete:${comment.id}`}
                      aria-label="Delete comment"
                      title="Delete"
                      onClick={() => {
                        setConfirmingId(comment.id)
                        setDeleteFailedId(null)
                        setPickerId(null)
                        focusAfterRender([`cancel-delete:${comment.id}`])
                      }}
                      className={cn(
                        actionButtonClassName,
                        "hover:text-destructive"
                      )}
                    >
                      <Trash2Icon />
                    </Button>
                  </>
                )}
              </div>
            )}
          </header>
          {isEditing ? (
            <CommentComposer
              label="Edit comment"
              placeholder="Edit your comment"
              submitLabel="Save"
              defaultValue={comment.body}
              suggestions={mentionSuggestions}
              failureMessage="Couldn't save your changes. Try again."
              focusKey={`editor:${comment.id}`}
              autoFocus
              onSubmit={(body) => saveEdit(comment, body)}
              onCancel={() => cancelEdit(comment)}
            />
          ) : (
            <CommentBody body={comment.body} suggestions={mentionSuggestions} />
          )}
          {isConfirming && (
            <div
              role="group"
              aria-label="Confirm delete"
              onKeyDown={(event) => {
                if (event.key !== "Escape" || isDeleting) return
                event.preventDefault()
                setConfirmingId(null)
                focusAfterRender([`delete:${comment.id}`])
              }}
              className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
            >
              <p className="mr-auto text-sm">Delete this comment?</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-focus-key={`cancel-delete:${comment.id}`}
                disabled={isDeleting}
                onClick={() => {
                  setConfirmingId(null)
                  focusAfterRender([`delete:${comment.id}`])
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                aria-busy={isDeleting || undefined}
                onClick={() => confirmDelete(comment)}
              >
                Delete
              </Button>
              {deleteFailedId === comment.id && (
                <p role="alert" className="w-full text-sm text-destructive">
                  Couldn&apos;t delete this comment. Try again.
                </p>
              )}
            </div>
          )}
          {(comment.reactions?.length ?? 0) > 0 && (
            <ul
              aria-label="Reactions"
              data-slot="comment-thread-reactions"
              className="flex flex-wrap gap-1.5"
            >
              {comment.reactions!.map((reaction) => {
                const label =
                  reactionLabels.get(reaction.emoji) ?? reaction.emoji
                const who = describeReactors(
                  reaction.userIds,
                  names,
                  currentUser?.id,
                  locale
                )
                return (
                  <li key={reaction.emoji}>
                    <button
                      type="button"
                      disabled={!canWrite}
                      aria-pressed={reacted.has(reaction.emoji)}
                      aria-label={`${label}: ${who}`}
                      title={who}
                      suppressHydrationWarning
                      onClick={() => react(comment, reaction.emoji)}
                      className="inline-flex h-6 items-center gap-1 rounded-full border bg-background px-2 text-xs tabular-nums outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default disabled:hover:bg-background aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
                    >
                      <span aria-hidden>{reaction.emoji}</span>
                      <span aria-hidden>{reaction.userIds.length}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </article>
    )
  }

  const resolveButton =
    canWrite && !isResolved && visibleCount > 0 ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-focus-key="resolve"
        onClick={() => setThreadResolved(true)}
      >
        <CircleCheckIcon />
        Resolve thread
      </Button>
    ) : null

  return (
    <section
      ref={rootRef}
      data-slot="comment-thread"
      data-resolved={isResolved || undefined}
      aria-label={ariaLabel}
      className={cn(
        "flex w-full flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground",
        className
      )}
      {...props}
    >
      {isResolved && (
        <div
          data-slot="comment-thread-resolved"
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <CircleCheckIcon
            aria-hidden
            className="size-4 shrink-0 text-primary"
          />
          <p className="mr-auto text-sm">
            <span className="font-medium">Resolved</span>
            {resolvedByAuthor && <> by {resolvedByAuthor.name}</>}
            <span className="text-muted-foreground">
              {" · "}
              {pluralize(visibleCount, "comment")}
            </span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-focus-key="toggle-thread"
            aria-expanded={isExpanded}
            aria-controls={`${id}-body`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide thread" : "Show thread"}
          </Button>
          {canWrite && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setThreadResolved(false)}
            >
              Reopen
            </Button>
          )}
        </div>
      )}
      <div id={`${id}-body`} hidden={!showBody} className="flex flex-col gap-4">
        {nodes.length > 0 ? (
          <ol aria-label="Comments" className="flex flex-col gap-5">
            {nodes.map((node) => (
              <li key={node.comment.id} className="flex flex-col gap-3">
                {renderComment(node.comment, node.comment.id, false)}
                {(node.replies.length > 0 ||
                  reply?.rootId === node.comment.id) && (
                  <div className="ml-4 flex flex-col gap-3 border-l pl-5">
                    {node.replies.length > 0 && (
                      <ol
                        aria-label={
                          node.comment.deleted
                            ? "Replies"
                            : `Replies to ${node.comment.author.name}`
                        }
                        className="flex flex-col gap-3"
                      >
                        {node.replies.map((comment) => (
                          <li key={comment.id}>
                            {renderComment(comment, node.comment.id, true)}
                          </li>
                        ))}
                      </ol>
                    )}
                    {reply?.rootId === node.comment.id && currentUser && (
                      <CommentComposer
                        key={reply.originId}
                        label="Reply"
                        placeholder="Write a reply"
                        submitLabel="Reply"
                        defaultValue={reply.prefill}
                        suggestions={mentionSuggestions}
                        failureMessage="Couldn't post your reply. Try again."
                        author={currentUser}
                        avatarSize="sm"
                        focusKey={`reply-composer:${node.comment.id}`}
                        autoFocus
                        onSubmit={async (body) => {
                          await postComment(node.comment.id, body)
                          closeReply()
                        }}
                        onCancel={closeReply}
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
        {canWrite && (
          <CommentComposer
            label="Comment"
            placeholder="Leave a comment"
            submitLabel="Comment"
            suggestions={mentionSuggestions}
            failureMessage="Couldn't post your comment. Try again."
            author={currentUser}
            focusKey="composer"
            actions={resolveButton}
            onSubmit={(body) => postComment(null, body)}
          />
        )}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  )
}

export { CommentThread }
