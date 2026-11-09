import type { ComponentType } from "react"

import { AccessibilityTreeFix } from "@/components/resources/accessibility-tree-fix"
import { CodingAgentGuide } from "@/components/resources/coding-agent-guide"
import { CollegeGuide } from "@/components/resources/college-guide"
import { FirstPrReview } from "@/components/resources/first-pr-review"
import { OneComponentSixteenFiles } from "@/components/resources/one-component-sixteen-files"
import { OpenSourceGuide } from "@/components/resources/open-source-guide"
import { MAINTAINERS, type Maintainer } from "@/lib/contributors"

export const RESOURCE_TAGS = [
  "Accessibility",
  "Coding agents",
  "Contributing",
  "drift-ui",
  "Open source",
  "Students",
] as const

export type ResourceTag = (typeof RESOURCE_TAGS)[number]

export type ResourceSection = {
  heading?: string
  paragraphs: string[]
}

export type ResourceOutlineItem = {
  id: string
  label: string
}

export type Resource = {
  slug: string
  title: string
  description: string
  publishedAt: string
  readMinutes: number
  author: Maintainer
  tags: ResourceTag[]
  tldr: string[]
  image?: { src: string; alt: string }
  sections: ResourceSection[]
  Content?: ComponentType
  outline?: ResourceOutlineItem[]
}

const [GAUTAM_ANAND] = MAINTAINERS

export const RESOURCES: Resource[] = [
  {
    slug: "what-goes-into-one-component",
    title: "What goes into one drift-ui component",
    description:
      "The trace waterfall installs as two files. Its pull request changed 16. A walk through each one, and the six bugs review caught before merge.",
    publishedAt: "2026-11-09",
    readMinutes: 5,
    author: GAUTAM_ANAND,
    tags: ["Contributing", "drift-ui"],
    tldr: [
      "Users install two files. The pull request also touched the registry manifest, docs, agent docs, the keyboard map, tests and the README.",
      "Pure logic in a lib file meant 15 of the 22 tests needed no rendering.",
      "Review found six bugs, including a two-span parent loop that emptied the whole tree.",
      "Insert into every list alphabetically, because a test fails if you append.",
    ],
    image: {
      src: "/images/resources/what-goes-into-one-component.png",
      alt: "A pull request listing trace waterfall files with their added lines, and a blue card labelled 16 files changed, beside the headline Two files to install. Sixteen to ship.",
    },
    sections: [],
    Content: OneComponentSixteenFiles,
    outline: [
      { id: "the-pr", label: "The pull request" },
      { id: "the-files", label: "Where the 16 files go" },
      { id: "split-logic", label: "Why the logic is separate" },
      { id: "registry-entry", label: "The registry entry" },
      { id: "keyboard", label: "The keyboard map" },
      { id: "review", label: "What review caught" },
      { id: "your-pr", label: "If you’re adding one" },
    ],
  },
  {
    slug: "fixing-our-accessibility-tree",
    title: "How we fixed the accessibility tree on drift-ui",
    description:
      "Lighthouse gave our home page 88 for Accessibility. What failed, how we fixed it across 74 component pages, and which numbers didn’t move.",
    publishedAt: "2026-11-01",
    readMinutes: 5,
    author: GAUTAM_ANAND,
    tags: ["Accessibility", "drift-ui"],
    tldr: [
      "Accessibility went from 88 to 100 and Agentic Browsing from 2 of 3 to 3 of 3 on the live site.",
      "Most fixes were names: use sr-only instead of hidden, and don’t let aria-label replace visible text.",
      "Performance stayed at 59 to 76 on cloud machines, and Largest Contentful Paint went up in three regions.",
      "A score of 100 doesn’t cover everything. One real bug we fixed isn’t counted in the score at all.",
    ],
    image: {
      src: "/images/resources/accessibility-tree-fix.png",
      alt: "An accessibility tree listing a tab, two buttons and a textbox, with a blue card labelled Well-formed drifting onto it, beside the headline Lighthouse said 88. The tree said why.",
    },
    sections: [],
    Content: AccessibilityTreeFix,
    outline: [
      { id: "what-the-tree-is", label: "What the tree is" },
      { id: "every-page", label: "Audit every page" },
      { id: "no-name", label: "A step with no name" },
      { id: "missing-panel", label: "An ID that pointed nowhere" },
      { id: "visible-text", label: "Hidden visible text" },
      { id: "wrong-role", label: "The wrong role" },
      { id: "contrast", label: "Contrast and scrolling" },
      { id: "results", label: "What the scores did" },
      { id: "what-didnt-change", label: "What didn’t improve" },
      { id: "try-it", label: "Try it yourself" },
    ],
  },
  {
    slug: "college-students-guide",
    title: "A college student’s guide to open source",
    description:
      "A week-by-week plan that fits around classes and exams, plus student benefits, resume wording and the dates worth putting in your calendar.",
    publishedAt: "2026-10-18",
    readMinutes: 4,
    author: GAUTAM_ANAND,
    tags: ["Open source", "Students"],
    tldr: [
      "Two or three hours a week across one semester can get a pull request merged.",
      "Keep midterm weeks free, and if you can’t finish a claimed issue, say so on the issue.",
      "Claim your GitHub student benefits in week one.",
      "On your resume, link the merged pull request and say what changed.",
    ],
    image: {
      src: "/images/resources/college-students-guide.png",
      alt: "A fourteen-week semester grid with two free weeks and a blue card labelled Merged drifting into the final slot, beside the headline One semester, one merged PR.",
    },
    sections: [],
    Content: CollegeGuide,
    outline: [
      { id: "semester-plan", label: "A plan for one semester" },
      { id: "student-benefits", label: "Student benefits" },
      { id: "pick-a-project", label: "Pick a project" },
      { id: "exams", label: "When exams get in the way" },
      { id: "friends", label: "A friend or a club" },
      { id: "coursework", label: "Keep coursework out of it" },
      { id: "resume", label: "Put it on your resume" },
      { id: "dates", label: "Dates for your calendar" },
      { id: "start-here", label: "Where to start this week" },
    ],
  },
  {
    slug: "using-a-coding-agent",
    title: "How to use a coding agent on an open source issue",
    description:
      "What an agent can do on your contribution, what stays with you, and how drift-ui sets agents up with AGENTS.md.",
    publishedAt: "2026-10-05",
    readMinutes: 3,
    author: GAUTAM_ANAND,
    tags: ["Coding agents", "Contributing"],
    tldr: [
      "Check the project’s AI policy first. Zig bans LLM use, and drift-ui allows agents.",
      "Point the agent at AGENTS.md and keep the decisions, like picking and claiming an issue, for yourself.",
      "Read the whole diff before you push, and answer review comments yourself.",
    ],
    image: {
      src: "/images/resources/using-a-coding-agent.png",
      alt: "A terminal running the work-on-issue command and stopping to ask for review, with a blue card labelled Your review, beside the headline The agent writes, you own the PR.",
    },
    sections: [],
    Content: CodingAgentGuide,
    outline: [
      { id: "check-the-rules", label: "Check the rules first" },
      { id: "agents-md", label: "AGENTS.md" },
      { id: "who-does-what", label: "Who does what" },
      { id: "review-it", label: "Review it yourself" },
      { id: "stays-human", label: "What stays with you" },
      { id: "using-components", label: "Using drift-ui from an agent" },
    ],
  },
  {
    slug: "what-a-maintainer-checks",
    title: "What a maintainer checks in your first PR",
    description:
      "The checks a pull request goes through on drift-ui, shown on a real one: the issue link, the scope, the tests and the known gaps.",
    publishedAt: "2026-09-22",
    readMinutes: 3,
    author: GAUTAM_ANAND,
    tags: ["Contributing", "drift-ui"],
    tldr: [
      "Link an issue, stay inside its scope, and explain what the diff can’t show.",
      "Give numbers for any new dependency, test keyboard use, and make sure CI passes.",
      "List what you didn’t do. You won’t lose points for naming a gap.",
    ],
    image: {
      src: "/images/resources/what-a-maintainer-checks.png",
      alt: "A pull request checklist with every item ticked and a blue card labelled Ready to merge, beside the headline Answer the review before it starts.",
    },
    sections: [],
    Content: FirstPrReview,
    outline: [
      { id: "closes-an-issue", label: "It closes an issue" },
      { id: "what-and-why", label: "What and why" },
      { id: "scope", label: "It stays in scope" },
      { id: "dependencies", label: "New dependencies" },
      { id: "tests", label: "Keyboard tests" },
      { id: "ci", label: "CI passes" },
      { id: "known-gaps", label: "Known gaps" },
      { id: "screenshots", label: "Screenshots" },
      { id: "if-you-get-stuck", label: "If you get stuck" },
    ],
  },
  {
    slug: "what-is-open-source",
    title: "What open source is and how to contribute",
    description:
      "A guide for students: what open source means, how a pull request works from fork to merge, and why Hacktoberfest stopped counting pull requests in 2026.",
    publishedAt: "2026-09-09",
    readMinutes: 6,
    author: GAUTAM_ANAND,
    tags: ["Contributing", "Open source", "Students"],
    tldr: [
      "Open source means the license lets anyone use, study, change and share the code. A public repo with no license doesn’t count.",
      "A contribution works the same way on most GitHub projects: find an issue, fork, branch, open a pull request and answer the review.",
      "You don’t have to write code. Docs, translations, bug reports and triage all help.",
      "Hacktoberfest stopped counting pull requests in 2026, so “four PRs for a T-shirt” advice is out of date.",
    ],
    image: {
      src: "/images/resources/what-is-open-source.png",
      alt: "A one-line README fix shown as a diff, with a blue card labelled Merged drifting onto it, beside the headline Your first pull request can be one line.",
    },
    sections: [],
    Content: OpenSourceGuide,
    outline: [
      { id: "what-open-source-means", label: "What open source means" },
      { id: "why-contribute", label: "Why contribute" },
      { id: "non-code-contributions", label: "Non-code contributions" },
      { id: "how-a-contribution-works", label: "How a contribution works" },
      { id: "hacktoberfest", label: "Hacktoberfest" },
      { id: "paid-programs", label: "Paid programs" },
      { id: "closed-pull-requests", label: "Avoiding a closed PR" },
      { id: "start-with-drift-ui", label: "Start with drift-ui" },
    ],
  },
  {
    slug: "building-drift-ui-in-the-open",
    title: "Building drift-ui in the open",
    description:
      "How an idea between two flatmates became an open source component registry, and why we want first-time contributors working on it.",
    publishedAt: "2026-08-27",
    readMinutes: 1,
    author: GAUTAM_ANAND,
    tags: ["drift-ui", "Open source"],
    tldr: [
      "drift-ui started as an idea between two flatmates, and the repo went public on October 31.",
      "It’s an MIT-licensed registry of components shadcn/ui doesn’t have.",
      "We’re building it in the open so people can learn on real code, and first-time contributors are welcome.",
    ],
    image: {
      src: "/images/resources/building-drift-ui-in-the-open.png",
      alt: "A grid of drift-ui components with one empty slot and a blue card labelled Your first PR drifting into it, beside the headline The next one is yours to build.",
    },
    sections: [
      {
        paragraphs: [
          "drift-ui started as an idea between two flatmates, Gautam Anand and Syed Fahad Junaid. We wanted to make a component library.",
          "The first commit landed in August 2026, and the repo went public on October 31.",
        ],
      },
      {
        heading: "What drift-ui is",
        paragraphs: [
          "drift-ui is a registry of the components shadcn/ui doesn't have, like a tags input, stepper, tree view and phone input. Everything is MIT licensed and installs with the shadcn CLI, so the source ends up in your repo.",
        ],
      },
      {
        heading: "Why we're building it in the open",
        paragraphs: [
          "A lot of people already use coss ui and similar libraries, and that's fine. The point here is learning.",
          "If you're an intern, a college student or an engineer at any level, come and contribute. We're looking for people who want to pick up their first open source issue.",
          "You'd work on real component code, from keyboard handling to tests, and a maintainer reviews your pull request. Once it's merged, you're on the contributors page.",
        ],
      },
    ],
  },
]

const DATE_FORMAT = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
})

export function resourcePath(slug: string) {
  return `/resources/${slug}`
}

export function resourceTagPath(tag: ResourceTag) {
  return `/resources?tag=${encodeURIComponent(tag)}`
}

export function resourceSearchText({
  title,
  description,
  author,
  tags,
  tldr,
}: Resource) {
  return [title, description, author.name, author.login, ...tags, ...tldr]
    .join(" ")
    .toLowerCase()
}

export function findResource(slug: string) {
  return RESOURCES.find((resource) => resource.slug === slug)
}

export function formatResourceDate(publishedAt: string) {
  return DATE_FORMAT.format(new Date(publishedAt))
}

export function headingId(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function resourceOutline(resource: Resource): ResourceOutlineItem[] {
  return (
    resource.outline ??
    resource.sections.flatMap(({ heading }) =>
      heading ? [{ id: headingId(heading), label: heading }] : []
    )
  )
}

export function nextResource(slug: string) {
  const index = RESOURCES.findIndex((resource) => resource.slug === slug)
  const next = RESOURCES[(index + 1) % RESOURCES.length]

  return next.slug === slug ? undefined : next
}
