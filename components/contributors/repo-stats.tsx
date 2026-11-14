import { CircleDotIcon, GitForkIcon, StarIcon } from "lucide-react"

import type { RepoStatCounts } from "@/lib/contributors"
import { siteConfig } from "@/lib/site-config"

export function RepoStats({ counts }: { counts: RepoStatCounts }) {
  const stats = [
    {
      value: counts.stars,
      one: "star",
      many: "stars",
      href: `${siteConfig.repo}/stargazers`,
      icon: StarIcon,
    },
    {
      value: counts.forks,
      one: "fork",
      many: "forks",
      href: `${siteConfig.repo}/forks`,
      icon: GitForkIcon,
    },
    {
      value: counts.openIssues,
      one: "open issue or PR",
      many: "open issues and PRs",
      href: `${siteConfig.repo}/issues`,
      icon: CircleDotIcon,
    },
  ]

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
      {stats.map((stat) => (
        <li key={stat.one}>
          <a
            href={stat.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-foreground"
          >
            <stat.icon className="size-3.5" />
            <span className="text-foreground tabular-nums">
              {stat.value.toLocaleString("en-US")}
            </span>
            {stat.value === 1 ? stat.one : stat.many}
          </a>
        </li>
      ))}
    </ul>
  )
}
