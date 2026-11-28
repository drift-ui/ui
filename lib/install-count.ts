import registry from "@/registry.json"

const ITEM_NAMES = new Set(registry.items.map((item) => item.name))

export function registryItemName(pathname: string) {
  const file = pathname.slice(pathname.lastIndexOf("/") + 1)
  if (!file.endsWith(".json")) return null
  const name = file.slice(0, -".json".length)
  return ITEM_NAMES.has(name) ? name : null
}

export function installWeekKey(now: Date) {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7
  const monday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysSinceMonday
    )
  )
  return `installs:${monday.toISOString().slice(0, 10)}`
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function recentInstallWeeks(now: Date, count: number) {
  return Array.from({ length: count }, (_, index) =>
    installWeekKey(new Date(now.getTime() - index * WEEK_MS))
  )
}

export function installTable(weeks: string[], hashes: (string[] | null)[]) {
  const counts = hashes.map((hash) => {
    const flat = hash ?? []
    const byItem = new Map<string, number>()
    for (let i = 0; i < flat.length; i += 2) {
      byItem.set(flat[i], Number(flat[i + 1]))
    }
    return byItem
  })
  const latest = counts[0]
  const items = [...new Set(counts.flatMap((byItem) => [...byItem.keys()]))]
    .filter((item) => item !== "_total")
    .sort(
      (a, b) =>
        (latest.get(b) ?? 0) - (latest.get(a) ?? 0) || a.localeCompare(b)
    )

  return [...items, "_total"].map((item) => ({
    item,
    ...Object.fromEntries(
      weeks.map((week, index) => [
        week.slice("installs:".length),
        counts[index]?.get(item) ?? 0,
      ])
    ),
  }))
}

export async function countInstall(item: string, now = new Date()) {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return

  const key = installWeekKey(now)
  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify([
      ["HINCRBY", key, item, 1],
      ["HINCRBY", key, "_total", 1],
    ]),
  }).catch(() => null)
  if (!response?.ok) {
    console.error(
      `install count for ${item} failed: ${response?.status ?? "network error"}`
    )
  }
}
