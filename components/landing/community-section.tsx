import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { siDiscord } from "simple-icons"

import { Button } from "@/registry/default/ui/button"
import { ContributorAvatar } from "@/components/contributors/contributor-avatar"
import { SectionHeading } from "@/components/landing/section-heading"
import {
  fetchCommunity,
  fetchFirstIssues,
  githubProfileOf,
  MAINTAINERS,
  type FirstIssue,
} from "@/lib/contributors"
import { siteConfig } from "@/lib/site-config"

function FirstIssues({ issues }: { issues: FirstIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="border-y py-6 text-sm text-muted-foreground">
        No good first issues to show right now.{" "}
        <a
          href={`${siteConfig.repo}/issues`}
          className="text-foreground underline underline-offset-4"
        >
          See all open issues
        </a>
        .
      </p>
    )
  }

  return (
    <ul className="border-t">
      {issues.map((issue) => (
        <li key={issue.number}>
          <a
            href={issue.url}
            className="group flex items-baseline gap-4 border-b py-3.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              #{issue.number}
            </span>
            <span className="underline-offset-4 group-hover:underline">
              {issue.title}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function ContributorCount({ total }: { total: number }) {
  return (
    <Link
      href="/contributors"
      prefetch={false}
      className="group flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {total} people have shipped code to drift-ui
      <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export async function CommunitySection() {
  const [issues, community] = await Promise.all([
    fetchFirstIssues(),
    fetchCommunity(),
  ])

  return (
    <section
      id="community"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-24 md:px-10 md:pb-36"
    >
      <SectionHeading
        title="Built in the open"
        lead="MIT licensed. Every component starts as an issue, and a merged pull request puts you on the contributors page."
      />
      <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-2 lg:gap-16">
        <div className="flex min-w-0 reveal flex-col gap-5">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            Good first issues
          </h3>
          <FirstIssues issues={issues} />
          <p className="text-sm text-muted-foreground">
            New to open source?{" "}
            <Link
              href="/resources"
              className="text-foreground underline underline-offset-4"
            >
              Read the guides
            </Link>{" "}
            before you claim one.
          </p>
        </div>
        <div className="flex min-w-0 reveal flex-col gap-5">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            Maintainers
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {MAINTAINERS.map((maintainer) => (
              <li key={maintainer.login}>
                <a
                  href={githubProfileOf(maintainer.login)}
                  className="flex items-center gap-3 rounded-2xl border bg-card/40 p-4 transition-colors outline-none hover:bg-card/70 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <ContributorAvatar
                    login={maintainer.login}
                    sizePx={40}
                    className="size-10"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {maintainer.name}
                    </span>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      @{maintainer.login}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <ContributorCount total={MAINTAINERS.length + community.length} />
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="h-11 px-5 active:scale-[0.98]">
              <a href={siteConfig.discord} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={siDiscord.path} />
                </svg>
                Join the Discord
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-5 active:scale-[0.98]"
            >
              <a
                href={`${siteConfig.repo}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noreferrer"
              >
                Read the contributing guide
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
