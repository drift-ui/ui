import { installTable, recentInstallWeeks } from "../lib/install-count"

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN
if (!url || !token) {
  console.error("Set KV_REST_API_URL and KV_REST_API_TOKEN in .env.redis")
  process.exit(1)
}

const weekCount = Number(process.argv[2] ?? 4)
const weeks = recentInstallWeeks(new Date(), weekCount)

const response = await fetch(`${url}/pipeline`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(weeks.map((week) => ["HGETALL", week])),
})
if (!response.ok) {
  console.error(`Upstash returned ${response.status}`)
  process.exit(1)
}

const results: { result: string[] | null }[] = await response.json()
console.log(`Installs by week (UTC, week starting Monday)`)
const table = installTable(
  weeks,
  results.map((entry) => entry.result)
)
console.table(
  Object.fromEntries(table.map(({ item, ...counts }) => [item, counts]))
)
