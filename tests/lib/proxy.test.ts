import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server"
import { NextRequest, type NextFetchEvent } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { config, proxy } from "@/proxy"

function fakeEvent() {
  return { waitUntil: vi.fn() } as unknown as NextFetchEvent & {
    waitUntil: ReturnType<typeof vi.fn>
  }
}

function redirectFor(pathname: string, cookie?: string) {
  const request = new NextRequest(new URL(pathname, "https://drift-ui.dev"), {
    headers: cookie ? { cookie } : undefined,
  })
  return new URL(proxy(request, fakeEvent()).headers.get("location") ?? "")
    .pathname
}

describe("component page redirect", () => {
  it("sends an unprefixed component URL to Base UI by default", () => {
    expect(redirectFor("/components/stepper")).toBe("/components/base/stepper")
  })

  it("remembers the library picked last", () => {
    expect(
      redirectFor("/components/stepper", "drift-ui-primitives=radix")
    ).toBe("/components/radix/stepper")
  })

  it("ignores an unknown library in the cookie", () => {
    expect(redirectFor("/components/stepper", "drift-ui-primitives=aria")).toBe(
      "/components/base/stepper"
    )
  })

  it("sends a bare library path to the component index", () => {
    expect(redirectFor("/components/radix")).toBe("/components")
  })
})

describe("registry install counting", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  function matches(url: string, userAgent?: string) {
    return unstable_doesMiddlewareMatch({
      config,
      url,
      headers: userAgent ? { "user-agent": userAgent } : {},
    })
  }

  it("runs only for requests from the shadcn CLI", () => {
    expect(matches("/r/new-york/cron-input.json", "shadcn")).toBe(true)
    expect(matches("/r/base-nova/cron-input.json", "shadcn")).toBe(true)
    expect(
      matches("/r/new-york/cron-input.json", "shadcn-registry-health/1.0")
    ).toBe(false)
    expect(matches("/r/new-york/cron-input.json", "Mozilla/5.0")).toBe(false)
    expect(matches("/r/new-york/cron-input.json")).toBe(false)
  })

  it("leaves a bare /r alone", () => {
    expect(matches("/r", "shadcn")).toBe(false)
  })

  it("passes the request through and counts the item after responding", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.example")
    vi.stubEnv("KV_REST_API_TOKEN", "secret")
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]"))
    vi.stubGlobal("fetch", fetchMock)
    const event = fakeEvent()

    const response = proxy(
      new NextRequest("https://drift-ui.dev/r/new-york/cron-input.json"),
      event
    )

    expect(response.headers.get("x-middleware-next")).toBe("1")
    expect(event.waitUntil).toHaveBeenCalledTimes(1)
    await event.waitUntil.mock.calls[0][0]
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)[0][2]).toBe("cron-input")
  })

  it("passes the registry index through without counting it", () => {
    const event = fakeEvent()

    const response = proxy(
      new NextRequest("https://drift-ui.dev/r/registry.json"),
      event
    )

    expect(response.headers.get("x-middleware-next")).toBe("1")
    expect(event.waitUntil).not.toHaveBeenCalled()
  })
})
