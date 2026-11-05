import * as React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  NotificationInbox,
  NotificationItem,
  type InboxNotification,
} from "@/registry/default/ui/notification-inbox"

const NOW = new Date(2026, 10, 5, 14, 30)

const ITEMS: InboxNotification[] = [
  {
    id: "review",
    title: "Noor requested your review",
    body: "Retry failed webhooks",
    createdAt: new Date(2026, 10, 5, 12),
    actor: { name: "Noor Haddad" },
  },
  {
    id: "deploy",
    title: "Deploy finished",
    createdAt: new Date(2026, 10, 5, 9),
    read: true,
  },
  {
    id: "invite",
    title: "Priya invited you",
    createdAt: new Date(2026, 10, 4, 18),
  },
]

type User = ReturnType<typeof userEvent.setup>

function trigger() {
  return screen.getByRole("button", { name: /^Notifications/ })
}

async function openInbox(user: User) {
  await user.click(trigger())
  return screen.findByRole("dialog", { name: "Notifications" })
}

function itemButton(name: string) {
  return screen.getByRole("button", {
    name: new RegExp(`^(Unread: ?)?${name}`),
  })
}

describe("NotificationInbox", () => {
  it("names the trigger with the unread count and shows a badge", () => {
    const { container } = render(<NotificationInbox defaultItems={ITEMS} />)

    expect(trigger()).toHaveAccessibleName("Notifications, 2 unread")
    expect(
      container.querySelector('[data-slot="notification-inbox-count"]')
    ).toHaveTextContent("2")
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 unread notifications"
    )
  })

  it("caps the badge at 99+ and hides it with nothing unread", () => {
    const many = Array.from({ length: 120 }, (_, index) => ({
      id: String(index),
      title: `Item ${index}`,
      createdAt: NOW,
    }))
    const { container, rerender } = render(<NotificationInbox items={many} />)
    expect(
      container.querySelector('[data-slot="notification-inbox-count"]')
    ).toHaveTextContent("99+")
    expect(trigger()).toHaveAccessibleName("Notifications, 120 unread")

    rerender(
      <NotificationInbox items={many.map((n) => ({ ...n, read: true }))} />
    )
    expect(
      container.querySelector('[data-slot="notification-inbox-count"]')
    ).toBeNull()
    expect(trigger()).toHaveAccessibleName("Notifications")
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
  })

  it("groups notifications by day, newest first", async () => {
    const user = userEvent.setup()
    render(<NotificationInbox defaultItems={ITEMS} now={NOW} locale="en-US" />)

    const dialog = await openInbox(user)

    const groups = within(dialog).getAllByRole("region")
    expect(groups[0]).toHaveAccessibleName("Today")
    expect(
      within(dialog)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(["Today", "Yesterday"])
    expect(within(groups[0]).getAllByRole("listitem")).toHaveLength(2)
    expect(groups[1]).toHaveAccessibleName("Yesterday")
    expect(itemButton("Noor requested your review")).toHaveAccessibleName(
      /^Unread: ?Noor requested your review ?Retry failed webhooks/
    )
    expect(itemButton("Deploy finished").textContent).not.toContain("Unread")
  })

  it("marks an item read when opened, then closes", async () => {
    const user = userEvent.setup()
    const onMarkRead = vi.fn()
    const onItemClick = vi.fn()
    render(
      <NotificationInbox
        defaultItems={ITEMS}
        onMarkRead={onMarkRead}
        onItemClick={onItemClick}
      />
    )

    await openInbox(user)
    await user.click(itemButton("Noor requested your review"))

    expect(onMarkRead).toHaveBeenCalledWith(["review"])
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "review" })
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(trigger()).toHaveAccessibleName("Notifications, 1 unread")
  })

  it("does not call onMarkRead when opening a read item", async () => {
    const user = userEvent.setup()
    const onMarkRead = vi.fn()
    const onItemClick = vi.fn()
    render(
      <NotificationInbox
        defaultItems={ITEMS}
        onMarkRead={onMarkRead}
        onItemClick={onItemClick}
      />
    )

    await openInbox(user)
    await user.click(itemButton("Deploy finished"))

    expect(onMarkRead).not.toHaveBeenCalled()
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "deploy" })
    )
  })

  it("toggles read state from the row without closing", async () => {
    const user = userEvent.setup()
    const onMarkRead = vi.fn()
    const onMarkUnread = vi.fn()
    render(
      <NotificationInbox
        defaultItems={ITEMS}
        onMarkRead={onMarkRead}
        onMarkUnread={onMarkUnread}
      />
    )

    const dialog = await openInbox(user)
    await user.click(
      within(dialog).getByRole("button", {
        name: "Mark as read: Priya invited you",
      })
    )
    expect(onMarkRead).toHaveBeenCalledWith(["invite"])
    expect(trigger()).toHaveAccessibleName("Notifications, 1 unread")

    const unreadToggle = within(dialog).getByRole("button", {
      name: "Mark as unread: Deploy finished",
    })
    await user.click(unreadToggle)
    expect(onMarkUnread).toHaveBeenCalledWith(["deploy"])
    expect(trigger()).toHaveAccessibleName("Notifications, 2 unread")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(unreadToggle).toHaveAccessibleName("Mark as read: Deploy finished")
  })

  it("marks everything read with one call to onMarkAllRead", async () => {
    const user = userEvent.setup()
    const onMarkAllRead = vi.fn()
    const onMarkRead = vi.fn()
    const onItemsChange = vi.fn()
    render(
      <NotificationInbox
        defaultItems={ITEMS}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
        onItemsChange={onItemsChange}
      />
    )

    const dialog = await openInbox(user)
    const markAll = within(dialog).getByRole("button", {
      name: "Mark all as read",
    })
    await user.click(markAll)

    expect(onMarkAllRead).toHaveBeenCalledTimes(1)
    expect(onMarkRead).not.toHaveBeenCalled()
    expect(onItemsChange).toHaveBeenCalledWith(
      ITEMS.map((n) => ({ ...n, read: true }))
    )
    expect(markAll).toHaveAttribute("aria-disabled", "true")
    expect(markAll).toHaveFocus()
    await user.click(markAll)
    expect(onMarkAllRead).toHaveBeenCalledTimes(1)
    expect(trigger()).toHaveAccessibleName("Notifications")
  })

  it("leaves a controlled list to the parent", async () => {
    const user = userEvent.setup()
    const onItemsChange = vi.fn()
    render(<NotificationInbox items={ITEMS} onItemsChange={onItemsChange} />)

    const dialog = await openInbox(user)
    await user.click(
      within(dialog).getByRole("button", {
        name: "Mark as read: Priya invited you",
      })
    )

    expect(onItemsChange).toHaveBeenCalledWith([
      ITEMS[0],
      ITEMS[1],
      { ...ITEMS[2], read: true },
    ])
    expect(trigger()).toHaveAccessibleName("Notifications, 2 unread")
  })

  it("moves between items with the arrow keys, Home and End", async () => {
    const user = userEvent.setup()
    render(<NotificationInbox defaultItems={ITEMS} now={NOW} />)

    trigger().focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("dialog")

    const first = itemButton("Noor requested your review")
    const second = itemButton("Deploy finished")
    const last = itemButton("Priya invited you")
    first.focus()

    await user.keyboard("{ArrowDown}")
    expect(second).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(last).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(last).toHaveFocus()
    await user.keyboard("{Home}")
    expect(first).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(first).toHaveFocus()
    await user.keyboard("{End}")
    expect(last).toHaveFocus()

    screen
      .getByRole("button", { name: "Mark as read: Noor requested your review" })
      .focus()
    await user.keyboard("{ArrowDown}")
    expect(second).toHaveFocus()
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup()
    render(<NotificationInbox defaultItems={ITEMS} />)

    await openInbox(user)
    itemButton("Deploy finished").focus()
    await user.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger()).toHaveFocus())
  })

  it("runs row actions and keeps focus in the list when the item goes away", async () => {
    const user = userEvent.setup()
    const archived: string[] = []

    function Archivable() {
      const [items, setItems] = React.useState(ITEMS)
      return (
        <NotificationInbox
          items={items}
          onItemsChange={setItems}
          now={NOW}
          actions={[
            {
              label: "Archive",
              icon: <span aria-hidden="true">A</span>,
              onSelect: (notification) => {
                archived.push(notification.id)
                setItems((current) =>
                  current.filter((n) => n.id !== notification.id)
                )
              },
            },
          ]}
        />
      )
    }

    render(<Archivable />)
    await openInbox(user)

    await user.click(
      screen.getByRole("button", {
        name: "Archive: Noor requested your review",
      })
    )
    expect(archived).toEqual(["review"])
    expect(itemButton("Deploy finished")).toHaveFocus()

    await user.click(
      screen.getByRole("button", { name: "Archive: Priya invited you" })
    )
    expect(itemButton("Deploy finished")).toHaveFocus()

    await user.click(
      screen.getByRole("button", { name: "Archive: Deploy finished" })
    )
    expect(screen.getByText("No notifications yet.")).toBeInTheDocument()
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(
      true
    )
  })

  it("renders an item with href as a link", async () => {
    const user = userEvent.setup()
    render(
      <NotificationInbox defaultItems={[{ ...ITEMS[0], href: "/pulls/482" }]} />
    )

    await openInbox(user)
    expect(
      screen.getByRole("link", { name: /Noor requested your review/ })
    ).toHaveAttribute("href", "/pulls/482")
  })

  it("passes custom fields to renderItem", async () => {
    const user = userEvent.setup()
    const items = ITEMS.map((n) => ({ ...n, kind: n.id.toUpperCase() }))
    render(
      <NotificationInbox
        defaultItems={items}
        renderItem={(n) => (
          <span>
            {n.kind}
            <NotificationItem {...n} />
          </span>
        )}
      />
    )

    await openInbox(user)
    expect(itemButton("REVIEW")).toHaveTextContent(
      /^Unread: ?REVIEW.*Noor requested your review/
    )
  })

  it("shows an empty state", async () => {
    const user = userEvent.setup()
    render(<NotificationInbox />)

    const dialog = await openInbox(user)
    expect(
      within(dialog).getByText("No notifications yet.")
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "Mark all as read" })
    ).toHaveAttribute("aria-disabled", "true")
  })

  it("supports a controlled open state and a custom label", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <NotificationInbox
        aria-label="Activity"
        defaultItems={ITEMS}
        open={false}
        onOpenChange={onOpenChange}
      />
    )

    await user.click(screen.getByRole("button", { name: "Activity, 2 unread" }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole("dialog")).toBeNull()

    rerender(
      <NotificationInbox
        aria-label="Activity"
        defaultItems={ITEMS}
        open
        onOpenChange={onOpenChange}
      />
    )
    expect(
      await screen.findByRole("dialog", { name: "Activity" })
    ).toBeInTheDocument()
  })

  it("forwards className and props to the trigger", () => {
    render(
      <NotificationInbox className="custom" data-testid="bell" id="bell" />
    )
    const button = screen.getByTestId("bell")
    expect(button).toHaveClass("custom")
    expect(button).toHaveAttribute("id", "bell")
    expect(button).toHaveAttribute("type", "button")
  })
})
