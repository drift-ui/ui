export type NotificationActor = {
  name: string
  avatarUrl?: string
}

export type InboxNotification = {
  id: string
  title: string
  body?: string
  createdAt: Date | string
  read?: boolean
  href?: string
  actor?: NotificationActor
}

export type NotificationGroup<T extends InboxNotification = InboxNotification> =
  {
    key: string
    label: string
    items: T[]
  }

const DAY_MS = 24 * 60 * 60 * 1000
const UNDATED_KEY = "undated"

export function toDate(value: Date | string | undefined | null) {
  if (value === undefined || value === null || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function capitalize(text: string, locale?: string) {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}

export function formatDayLabel(date: Date, now: Date, locale?: string) {
  const daysAgo = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS
  )
  if (Math.abs(daysAgo) <= 1) {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    return capitalize(relative.format(-daysAgo, "day"), locale)
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  }).format(date)
}

export function formatTime(date: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(date)
}

export function formatAbsoluteTime(date: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function groupByDay<T extends InboxNotification>(
  items: T[],
  now: Date,
  locale?: string,
  undatedLabel = "Earlier"
): NotificationGroup<T>[] {
  const dated = items
    .map((item, index) => ({ item, index, date: toDate(item.createdAt) }))
    .sort((a, b) => {
      if (a.date && b.date) {
        return b.date.getTime() - a.date.getTime() || a.index - b.index
      }
      if (a.date) return -1
      if (b.date) return 1
      return a.index - b.index
    })

  const groups: NotificationGroup<T>[] = []
  for (const { item, date } of dated) {
    const key = date ? dayKey(date) : UNDATED_KEY
    let group = groups[groups.length - 1]
    if (group?.key !== key) {
      group = {
        key,
        label: date ? formatDayLabel(date, now, locale) : undatedLabel,
        items: [],
      }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

export function countUnread(items: InboxNotification[]) {
  return items.reduce((total, item) => total + (item.read ? 0 : 1), 0)
}

export function unreadIds(items: InboxNotification[]) {
  return items.filter((item) => !item.read).map((item) => item.id)
}

export function setRead<T extends InboxNotification>(
  items: T[],
  ids: string[],
  read: boolean
): T[] {
  const targets = new Set(ids)
  let changed = false
  const next = items.map((item) => {
    if (!targets.has(item.id) || Boolean(item.read) === read) return item
    changed = true
    return { ...item, read }
  })
  return changed ? next : items
}

export function formatUnreadCount(count: number, max = 99) {
  return count > max ? `${max}+` : String(count)
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
