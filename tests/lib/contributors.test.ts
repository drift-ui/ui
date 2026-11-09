import { PHASE_PRODUCTION_BUILD } from "next/constants"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  fetchCommunity,
  fetchRepoStats,
  mergedPullsOf,
  openSeatsAfter,
  pickFirstIssues,
  rankCommunity,
  readableIssueTitle,
  type GitHubContributor,
  type GitHubIssue,
} from "@/lib/contributors"

function contributorOf(
  login: string,
  overrides: Partial<GitHubContributor> = {}
): GitHubContributor {
  return { login, type: "User", contributions: 1, ...overrides }
}

function respondWith(status: number, body: unknown = []) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function authorizationSentBy(fetchMock: ReturnType<typeof respondWith>) {
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  return new Headers(init.headers).get("Authorization")
}

describe("rankCommunity", () => {
  it("drops bots", () => {
    const ranked = rankCommunity([
      contributorOf("dependabot[bot]", { type: "Bot" }),
      contributorOf("octocat"),
    ])

    expect(ranked.map((contributor) => contributor.login)).toEqual(["octocat"])
  })

  it("drops maintainers whatever the login's case", () => {
    const ranked = rankCommunity([
      contributorOf("LocalhostD3veloper"),
      contributorOf("SYEDFAHADJUNAID"),
      contributorOf("octocat"),
    ])

    expect(ranked.map((contributor) => contributor.login)).toEqual(["octocat"])
  })

  it("ranks by contributions, highest first", () => {
    const ranked = rankCommunity([
      contributorOf("one", { contributions: 1 }),
      contributorOf("nine", { contributions: 9 }),
      contributorOf("three", { contributions: 3 }),
    ])

    expect(ranked.map((contributor) => contributor.login)).toEqual([
      "nine",
      "three",
      "one",
    ])
  })
})

describe("openSeatsAfter", () => {
  it.each([
    [0, 5],
    [3, 2],
    [5, 0],
    [6, 3],
    [9, 0],
    [10, 3],
  ])("after %i taken seats leaves %i open", (taken, open) => {
    expect(openSeatsAfter(taken)).toBe(open)
  })
})

describe("readableIssueTitle", () => {
  it.each([
    ["feat: add unit-input component", "Add unit-input component"],
    ["fix(stepper)!: restore focus", "Restore focus"],
    ["Add a date picker", "Add a date picker"],
  ])("turns %j into %j", (title, readable) => {
    expect(readableIssueTitle(title)).toBe(readable)
  })
})

describe("pickFirstIssues", () => {
  function issueOf(number: number, overrides: Partial<GitHubIssue> = {}) {
    return {
      number,
      title: `feat: issue ${number}`,
      html_url: `https://github.com/x/y/issues/${number}`,
      ...overrides,
    }
  }

  it("drops pull requests and keeps at most five issues", () => {
    const picked = pickFirstIssues([
      issueOf(1, { pull_request: {} }),
      ...[2, 3, 4, 5, 6, 7].map((number) => issueOf(number)),
    ])

    expect(picked.map((issue) => issue.number)).toEqual([2, 3, 4, 5, 6])
    expect(picked[0]).toEqual({
      number: 2,
      title: "Issue 2",
      url: "https://github.com/x/y/issues/2",
    })
  })
})

describe("mergedPullsOf", () => {
  it("searches the repo for the author's merged pull requests", () => {
    expect(decodeURIComponent(mergedPullsOf("octocat"))).toBe(
      "https://github.com/drift-ui/ui/pulls?q=is:pr is:merged author:octocat"
    )
  })
})

describe("fetchCommunity", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("returns the ranked community", async () => {
    respondWith(200, [
      contributorOf("one", { contributions: 1 }),
      contributorOf("two", { contributions: 2 }),
    ])

    const community = await fetchCommunity()

    expect(community.map((contributor) => contributor.login)).toEqual([
      "two",
      "one",
    ])
  })

  it("sends the token only when one is set", async () => {
    vi.stubEnv("GITHUB_TOKEN", "")
    const anonymous = respondWith(200)
    await fetchCommunity()
    expect(authorizationSentBy(anonymous)).toBeNull()

    vi.stubEnv("GITHUB_TOKEN", "secret")
    const authenticated = respondWith(200)
    await fetchCommunity()
    expect(authorizationSentBy(authenticated)).toBe("Bearer secret")
  })

  it("renders without community data when the build cannot reach GitHub", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD)
    vi.spyOn(console, "warn").mockImplementation(() => {})
    respondWith(403)

    await expect(fetchCommunity()).resolves.toEqual([])
  })

  it("renders without community data in development", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    respondWith(403)

    await expect(fetchCommunity()).resolves.toEqual([])
  })

  it("throws in production so the last good page keeps serving", async () => {
    vi.stubEnv("NODE_ENV", "production")
    respondWith(403)

    await expect(fetchCommunity()).rejects.toThrow("403")
  })
})

describe("fetchRepoStats", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("reads the repository counts", async () => {
    respondWith(200, {
      stargazers_count: 12,
      forks_count: 3,
      open_issues_count: 7,
    })

    await expect(fetchRepoStats()).resolves.toEqual({
      stars: 12,
      forks: 3,
      openIssues: 7,
    })
  })

  it("renders without stats when GitHub is unreachable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    respondWith(403)

    await expect(fetchRepoStats()).resolves.toBeNull()
  })
})
