import { ArrowUpRightIcon } from "lucide-react"

import type { FirstIssue } from "@/lib/contributors"
import { siteConfig } from "@/lib/site-config"

const GOOD_FIRST_ISSUES = `${siteConfig.repo}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`

const STEPS = [
  {
    title: "Pick an issue",
    body: "Start with a good first issue, or propose a component the registry is missing.",
    links: [{ href: GOOD_FIRST_ISSUES, label: "All good first issues" }],
    showsIssues: true,
  },
  {
    title: "Open a pull request",
    body: "Follow the contributing guide, link the issue with Closes #number and fill in the template. Stuck on review? Ask in #contributing on Discord.",
    links: [
      {
        href: `${siteConfig.repo}/blob/main/CONTRIBUTING.md`,
        label: "Contributing guide",
      },
      { href: siteConfig.discord, label: "Discord" },
    ],
    showsIssues: false,
  },
  {
    title: "Get merged",
    body: "This page reads GitHub's contributor list, so your handle shows up here within a few hours of the merge.",
    links: [
      {
        href: `${siteConfig.repo}/graphs/contributors`,
        label: "Contributor graph",
      },
    ],
    showsIssues: false,
  },
]

function IssueList({ issues }: { issues: FirstIssue[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-muted/30 md:col-span-7 md:col-start-6">
      {issues.map((issue) => (
        <li key={issue.number}>
          <a
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 px-4 py-3.5 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
          >
            <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              #{issue.number}
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-pretty">
              {issue.title}
            </span>
            <ArrowUpRightIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:transition-none"
            />
          </a>
        </li>
      ))}
    </ul>
  )
}

export function JoinSteps({ issues }: { issues: FirstIssue[] }) {
  return (
    <ol className="flex flex-col gap-8">
      {STEPS.map((step) => (
        <li
          key={step.title}
          className="grid gap-3 border-t pt-6 md:grid-cols-12 md:gap-6"
        >
          <h3 className="font-display text-3xl font-medium tracking-tight md:col-span-5 md:text-4xl">
            {step.title}
          </h3>
          <p className="max-w-[52ch] leading-relaxed text-muted-foreground md:col-span-5">
            {step.body}
          </p>
          <ul className="flex flex-col gap-1 md:col-span-2 md:items-end">
            {step.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit text-sm font-medium text-brand underline-offset-4 hover:underline md:text-right"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {step.showsIssues && issues.length > 0 && (
            <IssueList issues={issues} />
          )}
        </li>
      ))}
    </ol>
  )
}
