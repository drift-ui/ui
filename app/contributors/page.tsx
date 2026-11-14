import type { Metadata } from "next"

import { ContributorWall } from "@/components/contributors/contributor-wall"
import { JoinSteps } from "@/components/contributors/join-steps"
import { MaintainerCard } from "@/components/contributors/maintainer-card"
import { RepoStats } from "@/components/contributors/repo-stats"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import {
  fetchCommunity,
  fetchFirstIssues,
  fetchRepoStats,
  MAINTAINERS,
  STARS_BEFORE_STATS_SHOW,
} from "@/lib/contributors"
import { createPageMetadata } from "@/lib/page-metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Contributors",
  description:
    "The people behind drift-ui. Everyone whose pull request is merged gets a place on this page.",
  path: "/contributors",
})

function SectionTitle({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-5xl leading-none font-medium tracking-tighter md:text-7xl">
        {title}
      </h2>
      <p className="max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
        {lead}
      </p>
    </div>
  )
}

export default async function ContributorsPage() {
  const [community, repoStats, firstIssues] = await Promise.all([
    fetchCommunity(),
    fetchRepoStats(),
    fetchFirstIssues(),
  ])

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-28 px-4 pt-12 pb-28 md:gap-40 md:px-10 md:pt-16">
        <header className="flex flex-col gap-8 md:gap-10">
          <h1 className="rise font-display text-[38vw] leading-[0.86] font-medium tracking-tighter sm:text-[19.5vw] xl:text-[16rem]">
            <span className="block sm:inline">Hall of</span>{" "}
            <span className="text-brand">Fame</span>
          </h1>
          <div className="flex rise flex-col gap-6 border-t pt-6 [--rise-delay:120ms] lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            <p className="max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
              The people who build drift-ui. Every merged pull request puts its
              author on this page.
            </p>
            {repoStats && repoStats.stars >= STARS_BEFORE_STATS_SHOW && (
              <RepoStats counts={repoStats} />
            )}
          </div>
        </header>

        <section className="grid reveal gap-10 md:grid-cols-12 md:gap-6">
          <div className="self-start md:sticky md:top-24 md:col-span-4">
            <SectionTitle
              title="Maintainers"
              lead="They review pull requests, triage issues and keep the registry shipping."
            />
          </div>
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-6 md:col-span-8">
            {MAINTAINERS.map((maintainer) => (
              <MaintainerCard key={maintainer.login} maintainer={maintainer} />
            ))}
          </div>
        </section>

        <section className="flex reveal flex-col gap-10">
          <SectionTitle title="The wall" lead="Ranked by commits on main." />
          <ContributorWall community={community} />
        </section>

        <section id="join" className="flex reveal scroll-mt-24 flex-col gap-10">
          <SectionTitle
            title="Get on this page"
            lead="Three steps from an open issue to your name on the wall."
          />
          <JoinSteps issues={firstIssues} />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
