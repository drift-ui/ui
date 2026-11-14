import Link from "next/link"
import { ArrowRightIcon, HashIcon, MessagesSquareIcon } from "lucide-react"
import { siDiscord } from "simple-icons"

import { Button } from "@/registry/default/ui/button"
import { ContributorAvatar } from "@/components/contributors/contributor-avatar"
import { SectionHeading } from "@/components/landing/section-heading"
import { fetchCommunity, MAINTAINERS } from "@/lib/contributors"
import { siteConfig } from "@/lib/site-config"

const AVATARS_SHOWN = 6

const CHANNELS = [
  {
    name: "help",
    Icon: MessagesSquareIcon,
    description: "Stuck on a component? Ask here.",
  },
  {
    name: "showcase",
    Icon: MessagesSquareIcon,
    description: "Show what you built with drift-ui.",
  },
  {
    name: "ideas",
    Icon: MessagesSquareIcon,
    description: "Talk through a component before it becomes an issue.",
  },
  {
    name: "contributing",
    Icon: HashIcon,
    description: "Get unstuck on an issue or a pull request.",
  },
  {
    name: "github-feed",
    Icon: HashIcon,
    description: "Follow pull requests, issues and releases as they land.",
  },
]

async function ContributorsLink() {
  const community = await fetchCommunity()
  const logins = [
    ...MAINTAINERS.map((maintainer) => maintainer.login),
    ...community.map((contributor) => contributor.login),
  ]
  const hidden = logins.length - AVATARS_SHOWN

  return (
    <Link
      href="/contributors"
      prefetch={false}
      className="group flex max-w-md reveal items-center gap-4 rounded-2xl border bg-muted/30 p-4 transition-colors outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="flex shrink-0 -space-x-2.5">
        {logins.slice(0, AVATARS_SHOWN).map((login) => (
          <ContributorAvatar
            key={login}
            login={login}
            sizePx={32}
            className="size-8 ring-2 ring-background"
          />
        ))}
        {hidden > 0 && (
          <span className="flex size-8 items-center justify-center rounded-full border bg-muted text-[11px] font-medium text-muted-foreground tabular-nums ring-2 ring-background">
            +{hidden}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">Meet the contributors</span>
        <span className="text-sm text-muted-foreground">
          {logins.length} people have shipped code to drift-ui
        </span>
      </span>
      <ArrowRightIcon
        aria-hidden
        className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none"
      />
    </Link>
  )
}

export function CommunitySection() {
  return (
    <section
      id="community"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-24 md:px-10 md:pb-36"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-10">
          <SectionHeading
            eyebrow="Community"
            title="Built in the open"
            lead="The code, the issues and the pull requests are all public. Join the Discord to get help, show what you built and work on the next component with the maintainers."
          />
          <div className="flex reveal flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
          <ContributorsLink />
        </div>
        <div className="min-w-0 reveal overflow-hidden rounded-2xl border">
          <div className="flex h-10 items-center border-b px-4 font-mono text-xs text-muted-foreground">
            drift-ui on Discord
          </div>
          <ul className="divide-y bg-muted/30">
            {CHANNELS.map(({ name, Icon, description }) => (
              <li key={name} className="flex gap-3 px-4 py-4">
                <Icon
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-mono text-sm font-medium">{name}</span>
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
