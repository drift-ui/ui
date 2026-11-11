"use client"

import * as React from "react"
import {
  BellIcon,
  CheckCheckIcon,
  CheckIcon,
  CircleDotIcon,
} from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  countUnread,
  formatAbsoluteTime,
  formatTime,
  formatUnreadCount,
  groupByDay,
  initialsOf,
  setRead,
  toDate,
  unreadIds,
  type InboxNotification,
  type NotificationActor,
  type NotificationGroup,
} from "@/registry/default/lib/notification-inbox-utils"
import { cn } from "@/registry/default/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"
import { Button, buttonVariants } from "@/registry/default/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

export type { InboxNotification, NotificationActor, NotificationGroup }

export type NotificationAction<
  T extends InboxNotification = InboxNotification,
> = {
  label: string
  icon: React.ReactNode
  onSelect: (notification: T) => void
}

export interface NotificationItemProps extends InboxNotification {
  locale?: string
  className?: string
}

function NotificationItem({
  title,
  body,
  createdAt,
  read,
  actor,
  locale,
  className,
}: NotificationItemProps) {
  const date = toDate(createdAt)

  return (
    <span
      data-slot="notification-item"
      className={cn("flex min-w-0 flex-1 items-start gap-3", className)}
    >
      {actor && (
        <Avatar aria-hidden="true" className="size-8">
          {actor.avatarUrl && <AvatarImage src={actor.avatarUrl} alt="" />}
          <AvatarFallback className="text-xs font-medium">
            {initialsOf(actor.name)}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm leading-snug break-words",
            read ? "text-muted-foreground" : "font-medium text-foreground"
          )}
        >
          {title}
        </span>
        {body && (
          <span className="line-clamp-2 text-xs break-words text-muted-foreground">
            {body}
          </span>
        )}
        {date && (
          <time
            dateTime={date.toISOString()}
            title={formatAbsoluteTime(date, locale)}
            className="text-xs text-muted-foreground"
          >
            {formatTime(date, locale)}
          </time>
        )}
      </span>
    </span>
  )
}

export interface NotificationInboxProps<
  T extends InboxNotification = InboxNotification,
> extends Omit<React.ComponentProps<"button">, "children" | "type"> {
  items?: T[]
  defaultItems?: T[]
  onItemsChange?: (items: T[]) => void
  onMarkRead?: (ids: string[]) => void
  onMarkUnread?: (ids: string[]) => void
  onMarkAllRead?: () => void
  onItemClick?: (notification: T) => void
  actions?: NotificationAction<T>[]
  renderItem?: (notification: T) => React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  now?: Date
  locale?: string
  "aria-label"?: string
}

const ITEM_LINK_SELECTOR = '[data-slot="notification-inbox-item-link"]'

function itemLinks(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLElement>(ITEM_LINK_SELECTOR))
}

function NotificationInbox<T extends InboxNotification = InboxNotification>({
  items: itemsProp,
  defaultItems = [],
  onItemsChange,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
  onItemClick,
  actions = [],
  renderItem,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  now,
  locale,
  "aria-label": ariaLabel = "Notifications",
  className,
  ...props
}: NotificationInboxProps<T>) {
  const headingId = React.useId()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const restoreFocusIndex = React.useRef<number | null>(null)

  const { value: items, setValue: setItems } = useControllableState<T[]>({
    value: itemsProp,
    defaultValue: defaultItems,
    onChange: onItemsChange,
  })
  const { value: open, setValue: setOpen } = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  const unread = countUnread(items)
  const groups = groupByDay(items, now ?? new Date(), locale)
  const positions = new Map(
    groups
      .flatMap((group) => group.items)
      .map((item, index) => [item.id, index])
  )

  React.useLayoutEffect(() => {
    const index = restoreFocusIndex.current
    if (index === null) return
    restoreFocusIndex.current = null
    const panel = panelRef.current
    if (!panel || panel.contains(document.activeElement)) return
    const links = itemLinks(panel)
    ;(links[Math.min(index, links.length - 1)] ?? panel).focus()
  })

  function toggleRead(notification: T) {
    const read = !notification.read
    setItems(setRead(items, [notification.id], read))
    if (read) onMarkRead?.([notification.id])
    else onMarkUnread?.([notification.id])
  }

  function markAllRead() {
    if (unread === 0) return
    setItems(setRead(items, unreadIds(items), true))
    onMarkAllRead?.()
  }

  function openItem(notification: T) {
    if (!notification.read) {
      setItems(setRead(items, [notification.id], true))
      onMarkRead?.([notification.id])
    }
    onItemClick?.(notification)
    setOpen(false)
  }

  function runAction(
    action: NotificationAction<T>,
    notification: T,
    index: number
  ) {
    restoreFocusIndex.current = index
    action.onSelect(notification)
  }

  function handleListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return
    const panel = panelRef.current
    if (!panel) return
    const links = itemLinks(panel)
    const target = event.target as HTMLElement
    const current = links.findIndex((link) =>
      link.closest("li")?.contains(target)
    )
    if (current === -1) return
    const next = {
      ArrowDown: Math.min(current + 1, links.length - 1),
      ArrowUp: Math.max(current - 1, 0),
      Home: 0,
      End: links.length - 1,
    }[event.key]!
    event.preventDefault()
    links[next]?.focus()
  }

  const triggerLabel = unread > 0 ? `${ariaLabel}, ${unread} unread` : ariaLabel

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          data-slot="notification-inbox-trigger"
          aria-label={triggerLabel}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "relative",
            className
          )}
          {...props}
        >
          <BellIcon aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              data-slot="notification-inbox-count"
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-medium text-primary-foreground tabular-nums"
            >
              {formatUnreadCount(unread)}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          aria-labelledby={headingId}
          className="flex max-h-[calc(var(--radix-popover-content-available-height,var(--available-height,100vh))-0.5rem)] w-[min(24rem,calc(100vw-2rem))] flex-col p-0"
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            data-slot="notification-inbox"
            className="flex min-h-0 flex-col outline-none"
          >
            <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
              <h2 id={headingId} className="text-sm font-semibold">
                {ariaLabel}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-transparent"
                aria-disabled={unread === 0 || undefined}
                onClick={markAllRead}
              >
                <CheckCheckIcon aria-hidden="true" className="size-3.5" />
                Mark all as read
              </Button>
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <div
                className="max-h-[min(28rem,70vh)] min-h-0 overflow-y-auto overscroll-contain py-1"
                onKeyDown={handleListKeyDown}
              >
                {groups.map((group) => (
                  <section
                    key={group.key}
                    aria-labelledby={`${headingId}-${group.key}`}
                  >
                    <h3
                      id={`${headingId}-${group.key}`}
                      className="px-4 pt-2 pb-1 text-xs font-medium text-muted-foreground"
                    >
                      {group.label}
                    </h3>
                    <ul className="px-1">
                      {group.items.map((notification) => (
                        <InboxRow
                          key={notification.id}
                          notification={notification}
                          locale={locale}
                          actions={actions}
                          renderItem={renderItem}
                          onOpen={() => openItem(notification)}
                          onToggleRead={() => toggleRead(notification)}
                          onAction={(action) =>
                            runAction(
                              action,
                              notification,
                              positions.get(notification.id) ?? 0
                            )
                          }
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <span role="status" className="sr-only">
        {unread > 0
          ? `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
          : ""}
      </span>
    </>
  )
}

function InboxRow<T extends InboxNotification>({
  notification,
  locale,
  actions,
  renderItem,
  onOpen,
  onToggleRead,
  onAction,
}: {
  notification: T
  locale?: string
  actions: NotificationAction<T>[]
  renderItem?: (notification: T) => React.ReactNode
  onOpen: () => void
  onToggleRead: () => void
  onAction: (action: NotificationAction<T>) => void
}) {
  const { read, title, href } = notification
  const content = (
    <>
      {!read && <span className="sr-only">Unread: </span>}
      {renderItem ? (
        renderItem(notification)
      ) : (
        <NotificationItem {...notification} locale={locale} />
      )}
    </>
  )
  const linkClassName =
    "flex min-w-0 flex-1 items-start rounded-md p-2 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
  const actionClassName =
    "size-7 text-muted-foreground hover:text-foreground pointer-coarse:size-11"

  return (
    <li
      data-slot="notification-inbox-item"
      data-read={read ? "" : undefined}
      className="group/item flex items-start gap-1 rounded-md pl-2 transition-colors hover:bg-accent/60 has-focus-visible:bg-accent/60"
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-4 size-2 shrink-0 rounded-full",
          read ? "bg-transparent" : "bg-primary"
        )}
      />
      {href ? (
        <a
          href={href}
          data-slot="notification-inbox-item-link"
          className={linkClassName}
          onClick={onOpen}
        >
          {content}
        </a>
      ) : (
        <button
          type="button"
          data-slot="notification-inbox-item-link"
          className={linkClassName}
          onClick={onOpen}
        >
          {content}
        </button>
      )}
      <div className="flex shrink-0 items-center gap-0.5 py-1.5 pr-1 opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 pointer-coarse:gap-2 pointer-coarse:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={actionClassName}
          aria-label={`Mark as ${read ? "unread" : "read"}: ${title}`}
          title={read ? "Mark as unread" : "Mark as read"}
          onClick={onToggleRead}
        >
          {read ? (
            <CircleDotIcon aria-hidden="true" className="size-3.5" />
          ) : (
            <CheckIcon aria-hidden="true" className="size-3.5" />
          )}
        </Button>
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="ghost"
            size="icon"
            className={actionClassName}
            aria-label={`${action.label}: ${title}`}
            title={action.label}
            onClick={() => onAction(action)}
          >
            {action.icon}
          </Button>
        ))}
      </div>
    </li>
  )
}

export { NotificationInbox, NotificationItem }
