import { PHASE_PRODUCTION_BUILD } from "next/constants"

export type Maintainer = {
  login: string
  name: string
  website: string
}

export type GitHubContributor = {
  login: string
  type: string
  contributions: number
}

export type RepoStatCounts = {
  stars: number
  forks: number
  openIssues: number
}

type GitHubRepo = {
  stargazers_count: number
  forks_count: number
  open_issues_count: number
}

export type GitHubIssue = {
  number: number
  title: string
  html_url: string
  pull_request?: unknown
}

export type FirstIssue = {
  number: number
  title: string
  url: string
}

export const MAINTAINERS: Maintainer[] = [
  {
    login: "localhostd3veloper",
    name: "Gautam Anand",
    website: "https://localhostdeveloper.com",
  },
  {
    login: "syedfahadjunaid",
    name: "Syed Fahad Junaid",
    website: "https://syedfahadjunaid.netlify.app",
  },
]

const REPO_URL = "https://api.github.com/repos/localhostd3veloper/drift-ui"
const CONTRIBUTORS_URL = `${REPO_URL}/contributors?per_page=100`
const FIRST_ISSUES_URL = `${REPO_URL}/issues?state=open&assignee=none&labels=good%20first%20issue&per_page=20`
const FIRST_ISSUES_SHOWN = 5
export const STARS_BEFORE_STATS_SHOW = 25
const REVALIDATE_SECONDS = 3600
const REQUEST_TIMEOUT_MS = 5000
const FIRST_ROWS_SEATS = 5
const SEATS_PER_ROW = 4

const MAINTAINER_LOGINS = new Set(
  MAINTAINERS.map((maintainer) => maintainer.login.toLowerCase())
)

export function rankCommunity(contributors: GitHubContributor[]) {
  return contributors
    .filter(
      (contributor) =>
        contributor.type !== "Bot" &&
        !MAINTAINER_LOGINS.has(contributor.login.toLowerCase())
    )
    .sort((a, b) => b.contributions - a.contributions)
}

export function openSeatsAfter(takenSeats: number) {
  const seatsPastFirstRows = Math.max(takenSeats - FIRST_ROWS_SEATS, 0)
  const fullRows = Math.ceil(seatsPastFirstRows / SEATS_PER_ROW)
  return FIRST_ROWS_SEATS + fullRows * SEATS_PER_ROW - takenSeats
}

export function githubProfileOf(login: string) {
  return `https://github.com/${login}`
}

export function mergedPullsOf(login: string) {
  return `https://github.com/localhostd3veloper/drift-ui/pulls?q=${encodeURIComponent(`is:pr is:merged author:${login}`)}`
}

export function readableIssueTitle(title: string) {
  const bare = title.replace(/^\w+(\([^)]*\))?!?:\s*/, "")
  return bare.charAt(0).toUpperCase() + bare.slice(1)
}

export function pickFirstIssues(issues: GitHubIssue[]): FirstIssue[] {
  return issues
    .filter((issue) => !issue.pull_request)
    .slice(0, FIRST_ISSUES_SHOWN)
    .map((issue) => ({
      number: issue.number,
      title: readableIssueTitle(issue.title),
      url: issue.html_url,
    }))
}

function hasPreviousPageToKeepServing() {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD
  )
}

async function fetchGitHub<T>(url: string, fallback: T): Promise<T> {
  const token = process.env.GITHUB_TOKEN

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status} for ${url}`)
    }
    return await response.json()
  } catch (error) {
    if (hasPreviousPageToKeepServing()) throw error
    console.warn("Rendering /contributors without GitHub data", error)
    return fallback
  }
}

export async function fetchCommunity() {
  return rankCommunity(
    await fetchGitHub<GitHubContributor[]>(CONTRIBUTORS_URL, [])
  )
}

export async function fetchFirstIssues() {
  return pickFirstIssues(await fetchGitHub<GitHubIssue[]>(FIRST_ISSUES_URL, []))
}

export async function fetchRepoStats(): Promise<RepoStatCounts | null> {
  const repo = await fetchGitHub<GitHubRepo | null>(REPO_URL, null)
  return (
    repo && {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
    }
  )
}
