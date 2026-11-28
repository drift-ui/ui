import { afterEach, describe, expect, it, vi } from "vitest"

import {
  countInstall,
  installWeekKey,
  registryItemName,
} from "@/lib/install-count"

describe("registryItemName", () => {
  it("reads the item from every registry URL shape", () => {
    expect(registryItemName("/r/cron-input.json")).toBe("cron-input")
    expect(registryItemName("/r/new-york/cron-input.json")).toBe("cron-input")
    expect(registryItemName("/r/base-nova/cron-input.json")).toBe("cron-input")
    expect(registryItemName("/r/base/cron-input.json")).toBe("cron-input")
    expect(registryItemName("/r/styles/luma/shape.json")).toBe("shape")
  })

  it("skips the registry index and anything that is not an item", () => {
    expect(registryItemName("/r/registry.json")).toBeNull()
    expect(registryItemName("/r/not-a-component.json")).toBeNull()
    expect(registryItemName("/r/new-york/_total.json")).toBeNull()
    expect(registryItemName("/r/")).toBeNull()
    expect(registryItemName("/r/.json")).toBeNull()
    expect(registryItemName("/r/cron-input")).toBeNull()
  })
})

describe("installWeekKey", () => {
  it("files every day under the Monday that starts its UTC week", () => {
    expect(installWeekKey(new Date("2026-11-23T00:00:00Z"))).toBe(
      "installs:2026-11-23"
    )
    expect(installWeekKey(new Date("2026-11-28T12:00:00Z"))).toBe(
      "installs:2026-11-23"
    )
    expect(installWeekKey(new Date("2026-11-29T23:59:59Z"))).toBe(
      "installs:2026-11-23"
    )
    expect(installWeekKey(new Date("2026-11-30T00:00:00Z"))).toBe(
      "installs:2026-11-30"
    )
  })

  it("crosses month and year boundaries", () => {
    expect(installWeekKey(new Date("2027-01-01T08:00:00Z"))).toBe(
      "installs:2026-12-28"
    )
  })
})

describe("countInstall", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("does nothing without Redis credentials", async () => {
    vi.stubEnv("KV_REST_API_URL", "")
    vi.stubEnv("KV_REST_API_TOKEN", "")
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await countInstall("cron-input")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("increments the item and the weekly total in one pipeline call", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.example")
    vi.stubEnv("KV_REST_API_TOKEN", "secret")
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]"))
    vi.stubGlobal("fetch", fetchMock)

    await countInstall("cron-input", new Date("2026-11-28T12:00:00Z"))

    expect(fetchMock).toHaveBeenCalledWith("https://redis.example/pipeline", {
      method: "POST",
      headers: { Authorization: "Bearer secret" },
      body: JSON.stringify([
        ["HINCRBY", "installs:2026-11-23", "cron-input", 1],
        ["HINCRBY", "installs:2026-11-23", "_total", 1],
      ]),
    })
  })

  it("swallows a failed request so an install never breaks", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.example")
    vi.stubEnv("KV_REST_API_TOKEN", "secret")
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

    await expect(countInstall("cron-input")).resolves.toBeUndefined()
  })

  it("resolves when Upstash rejects the token", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.example")
    vi.stubEnv("KV_REST_API_TOKEN", "wrong")
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 401 }))
    )

    await expect(countInstall("cron-input")).resolves.toBeUndefined()
  })
})
