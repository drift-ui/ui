import { describe, expect, it } from "vitest"

import {
  countUnread,
  formatDayLabel,
  formatUnreadCount,
  groupByDay,
  initialsOf,
  setRead,
  toDate,
  unreadIds,
  type InboxNotification,
} from "@/registry/default/lib/notification-inbox"

const NOW = new Date(2026, 10, 5, 14, 30)

function at(day: number, hour: number, month = 10, year = 2026) {
  return new Date(year, month, day, hour)
}

function item(
  id: string,
  createdAt: Date | string,
  read = false
): InboxNotification {
  return { id, title: `Notification ${id}`, createdAt, read }
}

describe("toDate", () => {
  it("accepts dates and parseable strings and rejects the rest", () => {
    const date = at(5, 9)
    expect(toDate(date)).toBe(date)
    expect(toDate(date.toISOString())?.getTime()).toBe(date.getTime())
    expect(toDate("not a date")).toBeNull()
    expect(toDate("")).toBeNull()
    expect(toDate(undefined)).toBeNull()
  })
})

describe("formatDayLabel", () => {
  it("says Today and Yesterday by calendar day, not by 24 hours", () => {
    expect(formatDayLabel(at(5, 0), NOW, "en-US")).toBe("Today")
    expect(formatDayLabel(at(4, 23), NOW, "en-US")).toBe("Yesterday")
    expect(formatDayLabel(at(4, 0), NOW, "en-US")).toBe("Yesterday")
  })

  it("labels future days instead of folding them into Today", () => {
    expect(formatDayLabel(at(5, 23), NOW, "en-US")).toBe("Today")
    expect(formatDayLabel(at(6, 9), NOW, "en-US")).toBe("Tomorrow")
    expect(formatDayLabel(at(8, 9), NOW, "en-US")).toBe("Sunday, November 8")
  })

  it("names older days and adds the year only for another year", () => {
    expect(formatDayLabel(at(2, 9), NOW, "en-US")).toBe("Monday, November 2")
    expect(formatDayLabel(at(26, 9, 11, 2025), NOW, "en-US")).toBe(
      "Friday, December 26, 2025"
    )
  })

  it("follows the locale", () => {
    expect(formatDayLabel(at(5, 9), NOW, "de")).toBe("Heute")
    expect(formatDayLabel(at(4, 9), NOW, "de")).toBe("Gestern")
  })
})

describe("groupByDay", () => {
  it("groups by local day, newest day and newest item first", () => {
    const items = [
      item("old", at(2, 9)),
      item("today-early", at(5, 8)),
      item("yesterday", at(4, 22)),
      item("today-late", at(5, 13)),
    ]

    const groups = groupByDay(items, NOW, "en-US")

    expect(groups.map((group) => group.label)).toEqual([
      "Today",
      "Yesterday",
      "Monday, November 2",
    ])
    expect(groups[0].items.map((entry) => entry.id)).toEqual([
      "today-late",
      "today-early",
    ])
    expect(groups.map((group) => group.key)).toEqual([
      "2026-11-05",
      "2026-11-04",
      "2026-11-02",
    ])
  })

  it("keeps input order for identical timestamps", () => {
    const items = [
      item("a", at(5, 9)),
      item("b", at(5, 9)),
      item("c", at(5, 9)),
    ]
    expect(groupByDay(items, NOW)[0].items.map((entry) => entry.id)).toEqual([
      "a",
      "b",
      "c",
    ])
  })

  it("puts items with invalid dates last under one group", () => {
    const items = [
      item("bad-1", "nope"),
      item("good", at(5, 9)),
      item("bad-2", ""),
    ]

    const groups = groupByDay(items, NOW, "en-US", "Older")

    expect(groups.map((group) => group.label)).toEqual(["Today", "Older"])
    expect(groups[1].items.map((entry) => entry.id)).toEqual(["bad-1", "bad-2"])
  })

  it("returns no groups for no items", () => {
    expect(groupByDay([], NOW)).toEqual([])
  })

  it("keeps extra fields on the items", () => {
    const items = [{ ...item("a", at(5, 9)), kind: "deploy" as const }]
    expect(groupByDay(items, NOW)[0].items[0].kind).toBe("deploy")
  })
})

describe("read state", () => {
  const items = [
    item("a", at(5, 9)),
    item("b", at(5, 8), true),
    item("c", at(5, 7)),
  ]

  it("counts and lists unread items", () => {
    expect(countUnread(items)).toBe(2)
    expect(unreadIds(items)).toEqual(["a", "c"])
    expect(countUnread([])).toBe(0)
  })

  it("marks the given ids and keeps every other item as is", () => {
    const next = setRead(items, ["a"], true)
    expect(next.map((entry) => entry.read)).toEqual([true, true, false])
    expect(next[1]).toBe(items[1])
    expect(next[2]).toBe(items[2])
    expect(items[0].read).toBe(false)
  })

  it("marks an item unread", () => {
    expect(setRead(items, ["b"], false)[1].read).toBe(false)
  })

  it("returns the same array when nothing changes", () => {
    expect(setRead(items, ["b"], true)).toBe(items)
    expect(setRead(items, ["missing"], true)).toBe(items)
    expect(setRead(items, [], true)).toBe(items)
  })

  it("treats a missing read field as unread", () => {
    const loose: InboxNotification[] = [
      { id: "x", title: "X", createdAt: at(5, 9) },
    ]
    expect(countUnread(loose)).toBe(1)
    expect(setRead(loose, ["x"], false)).toBe(loose)
  })
})

describe("formatUnreadCount", () => {
  it("caps the badge at 99+", () => {
    expect(formatUnreadCount(1)).toBe("1")
    expect(formatUnreadCount(99)).toBe("99")
    expect(formatUnreadCount(100)).toBe("99+")
  })
})

describe("initialsOf", () => {
  it("takes the first and last initials", () => {
    expect(initialsOf("Noor Haddad")).toBe("NH")
    expect(initialsOf("Ana Maria Silva")).toBe("AS")
    expect(initialsOf("priya")).toBe("PR")
    expect(initialsOf("  ")).toBe("?")
  })
})
