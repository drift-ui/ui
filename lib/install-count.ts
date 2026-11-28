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

export async function countInstall(item: string, now = new Date()) {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return

  const key = installWeekKey(now)
  await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify([
      ["HINCRBY", key, item, 1],
      ["HINCRBY", key, "_total", 1],
    ]),
  }).catch(() => null)
}
