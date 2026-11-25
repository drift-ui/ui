import { iconNames, type IconName } from "lucide-react/dynamic"

export type IconItem = {
  name: string
  tags?: string[]
}

export type IconSection = {
  id: string
  label: string
  icons: IconItem[]
}

export type IconCell = {
  row: number
  column: number
}

export type IconPreferences = {
  recent: string[]
}

export const RECENT_SECTION_ID = "recent"
export const ALL_SECTION_ID = "all"
export const MAX_RECENT = 16
export const STORAGE_KEY = "drift-ui:icon-picker"

const VALID_NAMES = new Set<string>(iconNames)

export function isValidIconName(name: string): name is IconName {
  return VALID_NAMES.has(name)
}

export const LUCIDE_TAGS: Record<string, string[]> = {
  activity: ["heartbeat", "pulse", "health", "monitor", "status", "fitness"],
  "alert-circle": ["warning", "danger", "error", "info", "notice"],
  "alert-triangle": ["warning", "danger", "caution", "alert", "error"],
  archive: ["box", "storage", "save", "package"],
  award: ["trophy", "medal", "prize", "badge", "achievement"],
  "bar-chart": ["graph", "analytics", "statistics", "metrics", "chart"],
  "bar-chart-2": ["graph", "analytics", "statistics", "metrics"],
  "bar-chart-3": ["graph", "analytics", "statistics", "metrics"],
  battery: ["power", "charge", "energy"],
  "battery-charging": ["power", "charge", "plug", "energy"],
  bell: ["notification", "alert", "reminder", "alarm"],
  "bell-off": ["silent", "mute", "quiet", "disable notifications"],
  bluetooth: ["wireless", "connectivity", "device"],
  bookmark: ["save", "favorite", "marker", "read later"],
  bot: ["robot", "ai", "assistant", "agent", "automation"],
  box: ["package", "cube", "container", "storage"],
  briefcase: ["work", "job", "business", "portfolio"],
  bug: ["issue", "error", "defect", "problem", "inspect", "debug"],
  calendar: ["date", "schedule", "event", "month", "time", "planner"],
  "calendar-check": ["scheduled", "todo", "appointment", "done"],
  "calendar-days": ["week", "month", "schedule"],
  camera: ["photo", "picture", "snapshot", "image", "lens"],
  check: ["tick", "done", "confirm", "ok", "verify", "success", "accept"],
  "check-check": ["read", "delivered", "double check"],
  "check-circle": ["done", "completed", "resolved", "success"],
  "check-square": ["todo", "task", "done", "checkbox"],
  clock: ["time", "watch", "timer", "schedule", "hour", "minute"],
  cloud: ["storage", "weather", "upload", "sync", "backup"],
  "cloud-rain": ["weather", "shower", "storm", "rainy"],
  code: ["developer", "syntax", "source", "programming", "html", "tag"],
  "code-2": ["developer", "syntax", "brackets", "programming"],
  compass: ["navigation", "direction", "explore", "safari"],
  copy: ["duplicate", "clone", "clipboard"],
  cpu: ["processor", "chip", "hardware", "computer", "ai"],
  "credit-card": ["payment", "money", "billing", "card", "purchase"],
  database: ["sql", "storage", "server", "data", "records"],
  delete: ["backspace", "remove", "erase"],
  "dollar-sign": ["money", "currency", "price", "cash", "finance", "usd"],
  download: ["save", "export", "fetch", "get"],
  edit: ["pencil", "pen", "write", "modify", "change"],
  "edit-2": ["pencil", "pen", "write"],
  "edit-3": ["pencil", "pen", "write"],
  "external-link": ["open", "new tab", "new window", "hyperlink", "url"],
  eye: ["view", "show", "visible", "see", "watch"],
  "eye-off": ["hide", "hidden", "invisible", "conceal", "private"],
  file: ["document", "sheet", "page", "paper"],
  "file-text": ["document", "sheet", "notes", "article"],
  filter: ["sort", "refine", "funnel", "query"],
  flag: ["report", "country", "marker", "milestone", "priority"],
  folder: ["directory", "group", "category", "collection"],
  "folder-open": ["directory", "browse", "collection"],
  frown: ["sad", "face", "negative", "unhappy"],
  gauge: ["meter", "speed", "dashboard", "metric", "performance"],
  gift: ["present", "reward", "surprise", "bonus"],
  "git-branch": ["vcs", "code", "fork", "version"],
  "git-commit": ["vcs", "code", "log", "history"],
  "git-pull-request": ["pr", "merge", "vcs", "code"],
  globe: ["world", "earth", "web", "international", "planet", "internet"],
  grid: ["table", "cards", "layout", "matrix"],
  "hard-drive": ["storage", "disk", "memory", "drive"],
  heart: ["like", "love", "favorite", "health"],
  "help-circle": ["question", "faq", "support", "help", "info"],
  history: ["recent", "time", "clock", "past", "log", "audit"],
  home: ["house", "main", "dashboard", "index"],
  image: ["picture", "photo", "graphic", "gallery"],
  inbox: ["tray", "mail", "messages", "received"],
  info: ["information", "help", "about", "details", "notice"],
  key: ["password", "auth", "access", "token", "unlock"],
  laptop: ["macbook", "computer", "notebook"],
  layers: ["stack", "pile", "sheets", "levels"],
  layout: ["grid", "template", "dashboard", "wireframe"],
  "life-buoy": ["help", "support", "rescue", "faq"],
  link: ["url", "chain", "hyperlink", "anchor"],
  list: ["tasks", "bullet", "todo", "menu", "checklist"],
  lock: ["security", "password", "private", "protect", "closed"],
  "log-in": ["signin", "enter", "access"],
  "log-out": ["signout", "exit", "leave"],
  mail: ["email", "envelope", "message", "inbox"],
  map: ["navigation", "travel", "gps", "directions", "location"],
  "map-pin": ["location", "place", "spot", "marker", "address", "gps"],
  maximize: ["fullscreen", "expand", "scale"],
  meh: ["neutral", "face", "indifferent"],
  "message-circle": ["chat", "comment", "conversation"],
  "message-square": ["chat", "comment", "bubble", "talk", "feedback"],
  mic: ["microphone", "audio", "record", "voice", "podcast"],
  minimize: ["shrink", "collapse", "exit fullscreen"],
  minus: ["remove", "subtract", "decrease", "hyphen"],
  monitor: ["screen", "display", "desktop", "computer"],
  moon: ["dark", "night", "lunar", "evening", "weather"],
  music: ["audio", "sound", "tune", "song", "note"],
  paperclip: ["attachment", "attach", "file"],
  pen: ["edit", "write", "sign"],
  pencil: ["edit", "write", "draw", "compose"],
  phone: ["call", "telephone", "contact", "support"],
  "pie-chart": ["diagram", "analytics", "breakdown"],
  plus: ["add", "create", "new", "more"],
  power: ["on", "off", "shutdown", "turn off", "switch"],
  printer: ["print", "paper", "document"],
  redo: ["forward", "repeat", "next"],
  "refresh-cw": ["reload", "sync", "repeat", "rotate", "cycle"],
  repeat: ["loop", "sync", "again"],
  scissors: ["cut", "snip", "trim"],
  search: ["find", "magnifying glass", "zoom", "query", "explore"],
  send: ["paper plane", "message", "mail", "fly", "submit"],
  server: ["network", "hardware", "host", "cloud", "data"],
  settings: ["gear", "cog", "preferences", "options", "config"],
  share: ["forward", "export", "social"],
  "share-2": ["forward", "export", "social"],
  shield: ["security", "safety", "protect", "defense", "secure"],
  "shield-alert": ["warning", "danger", "vulnerability"],
  "shield-check": ["verified", "safe", "secure"],
  "shopping-bag": ["bag", "store", "buy", "shop", "ecommerce"],
  "shopping-cart": ["cart", "basket", "store", "buy", "ecommerce", "purchase"],
  shuffle: ["random", "sort", "mix"],
  sliders: ["controls", "settings", "filter", "adjust"],
  smartphone: ["mobile", "phone", "iphone", "android", "device"],
  smile: ["happy", "emoji", "face", "positive"],
  sparkles: ["magic", "ai", "stars", "clean", "fresh", "shine"],
  star: ["favorite", "bookmark", "rating", "like"],
  sun: ["light", "day", "bright", "sunny", "weather"],
  tag: ["label", "badge", "category", "price", "ticket"],
  tags: ["labels", "badges", "categories"],
  terminal: ["console", "code", "cli", "command", "shell", "bash"],
  "thumbs-down": ["dislike", "reject", "vote", "no", "disagree"],
  "thumbs-up": ["like", "approve", "vote", "yes", "agree"],
  trash: ["delete", "remove", "bin", "garbage", "rubbish"],
  "trash-2": ["delete", "remove", "bin", "garbage"],
  "trending-down": ["decrease", "decline", "metrics", "graph", "stats"],
  "trending-up": [
    "growth",
    "increase",
    "metrics",
    "graph",
    "stats",
    "analytics",
  ],
  trophy: ["winner", "cup", "award", "prize", "achievement"],
  undo: ["revert", "back", "previous"],
  unlock: ["open", "public", "unprotect", "access"],
  upload: ["import", "send", "cloud", "publish"],
  user: ["person", "account", "profile", "member", "avatar"],
  users: ["group", "team", "people", "members", "collaborators"],
  video: ["camera", "movie", "film", "record", "clip"],
  "volume-2": ["sound", "speaker", "audio", "loud"],
  "volume-x": ["mute", "silent", "quiet", "no sound"],
  wallet: ["money", "finance", "cash", "payment"],
  "wand-2": ["magic", "ai", "auto", "generate", "wizard"],
  wifi: ["internet", "network", "wireless", "connection"],
  x: ["close", "cross", "cancel", "dismiss", "delete", "clear"],
  zap: ["lightning", "bolt", "electric", "fast", "power", "energy"],
}

export function normalizeIcons(icons?: (string | IconItem)[]): IconItem[] {
  if (!icons) {
    return iconNames.map((name) => ({ name }))
  }
  return icons.map((item) => (typeof item === "string" ? { name: item } : item))
}

export function normalizeColumns(columns: number, fallback: number) {
  return Number.isFinite(columns) && columns >= 1
    ? Math.floor(columns)
    : fallback
}

export function searchIcons(
  icons: IconItem[],
  query: string,
  customTags?: Record<string, string[]>
): IconItem[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return icons

  return icons.filter((icon) => {
    const name = icon.name.toLowerCase()
    if (name.includes(needle)) return true

    const segments = name.split("-")
    if (segments.some((seg) => seg.startsWith(needle))) return true

    if (icon.tags?.some((tag) => tag.toLowerCase().includes(needle))) {
      return true
    }

    if (
      customTags?.[icon.name]?.some((tag) => tag.toLowerCase().includes(needle))
    ) {
      return true
    }

    if (
      LUCIDE_TAGS[icon.name]?.some((tag) => tag.toLowerCase().includes(needle))
    ) {
      return true
    }

    return false
  })
}

export function buildSections(
  icons: IconItem[],
  recent: string[],
  allLabel = "All icons"
): IconSection[] {
  const recentIcons = recent.flatMap(
    (name) => icons.find((icon) => icon.name === name) ?? []
  )

  const allSection: IconSection = {
    id: ALL_SECTION_ID,
    label: allLabel,
    icons,
  }

  return recentIcons.length > 0
    ? [
        {
          id: RECENT_SECTION_ID,
          label: "Recently used",
          icons: recentIcons,
        },
        allSection,
      ]
    : [allSection]
}

export function layoutSections(
  sections: IconSection[],
  requestedColumns: number
) {
  const columns = normalizeColumns(requestedColumns, 1)
  const rows: IconItem[][] = []
  const laidOut = sections
    .filter((section) => section.icons.length > 0)
    .map((section) => {
      const firstRow = rows.length
      for (let index = 0; index < section.icons.length; index += columns) {
        rows.push(section.icons.slice(index, index + columns))
      }
      return { ...section, firstRow, rowCount: rows.length - firstRow }
    })

  return { rows, sections: laidOut }
}

export function moveCell(
  rowLengths: number[],
  sectionStarts: number[],
  { row, column }: IconCell,
  key: string,
  toGridEdge: boolean
): IconCell | null {
  const lastRow = rowLengths.length - 1
  const lastColumn = (target: number) => rowLengths[target] - 1
  const sameColumnIn = (target: number) => ({
    row: target,
    column: Math.min(column, lastColumn(target)),
  })

  switch (key) {
    case "ArrowRight":
      if (column < lastColumn(row)) return { row, column: column + 1 }
      return row < lastRow ? { row: row + 1, column: 0 } : { row, column }
    case "ArrowLeft":
      if (column > 0) return { row, column: column - 1 }
      return row > 0
        ? { row: row - 1, column: lastColumn(row - 1) }
        : { row, column }
    case "ArrowDown":
      return sameColumnIn(Math.min(row + 1, lastRow))
    case "ArrowUp":
      return sameColumnIn(Math.max(row - 1, 0))
    case "Home":
      return toGridEdge ? { row: 0, column: 0 } : { row, column: 0 }
    case "End":
      return toGridEdge
        ? { row: lastRow, column: lastColumn(lastRow) }
        : { row, column: lastColumn(row) }
    case "PageDown": {
      const next = sectionStarts.find((start) => start > row)
      return next === undefined
        ? { row: lastRow, column: lastColumn(lastRow) }
        : { row: next, column: 0 }
    }
    case "PageUp":
      return {
        row: sectionStarts.findLast((start) => start < row) ?? 0,
        column: 0,
      }
    default:
      return null
  }
}

export function addRecent(
  recent: string[],
  name: string,
  maxRecent = MAX_RECENT
): string[] {
  return [name, ...recent.filter((item) => item !== name)].slice(0, maxRecent)
}

export function readPreferences(storageKey = STORAGE_KEY): IconPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}")
    return {
      recent: Array.isArray(stored.recent)
        ? stored.recent.filter((item: unknown) => typeof item === "string")
        : [],
    }
  } catch {
    return { recent: [] }
  }
}

export function writePreferences(
  preferences: IconPreferences,
  storageKey = STORAGE_KEY
) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    return
  }
}
