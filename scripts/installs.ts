import { installTable, recentInstallWeeks } from "../lib/install-count"

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN
if (!url || !token) {
  console.error("Set KV_REST_API_URL and KV_REST_API_TOKEN in .env.redis")
  process.exit(1)
}

const weekCount = Number(process.argv[2] ?? 4)
if (!Number.isInteger(weekCount) || weekCount < 1) {
  console.error("Usage: bun run installs [weeks], where weeks is 1 or more")
  process.exit(1)
}
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

const results: { result?: string[] | null; error?: string }[] =
  await response.json()
const failed = results.find((entry) => entry.error)
if (failed) {
  console.error(`Upstash returned an error: ${failed.error}`)
  process.exit(1)
}

console.log(`Installs by week (UTC, week starting Monday)`)
const table = installTable(
  weeks,
  results.map((entry) => entry.result ?? null)
)
console.table(
  Object.fromEntries(table.map(({ item, ...counts }) => [item, counts]))
)
