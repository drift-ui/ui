import type { ReactNode } from "react"
import { ArrowUpRightIcon, GitMergeIcon, PlusIcon } from "lucide-react"

import { ContributorAvatar } from "@/components/contributors/contributor-avatar"
import {
  githubProfileOf,
  mergedPullsOf,
  openSeatsAfter,
  type GitHubContributor,
} from "@/lib/contributors"
import { cn } from "@/registry/default/lib/utils"

const SEAT_BASE =
  "group relative isolate flex h-full flex-col justify-between gap-8 overflow-hidden rounded-2xl p-5 outline-none transition-[translate,border-color,background-color] hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
const LEAD_SEAT =
  "min-h-80 bg-brand-solid text-brand-solid-foreground md:min-h-full md:p-8"
const SEAT_SIZE = "min-h-48"

function RankMark({ rank, isLead }: { rank: number; isLead: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -z-10 font-display leading-none font-medium tracking-tighter tabular-nums select-none",
        isLead
          ? "-right-2 -bottom-6 text-[10rem] text-brand-solid-foreground/15 md:-bottom-10 md:text-[16rem]"
          : "right-4 bottom-[-0.12em] text-7xl text-foreground/[0.07]"
      )}
    >
      {String(rank).padStart(2, "0")}
    </span>
  )
}

function SeatArrow({ isLead }: { isLead: boolean }) {
  return (
    <ArrowUpRightIcon
      aria-hidden
      className={cn(
        "shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none",
        isLead
          ? "size-6 text-brand-solid-foreground/80"
          : "size-4 text-muted-foreground group-hover:text-foreground"
      )}
    />
  )
}

function SeatText({
  title,
  detail,
  isLead,
}: {
  title: ReactNode
  detail: ReactNode
  isLead: boolean
}) {
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span
        className={cn(
          "truncate font-display font-medium tracking-tight",
          isLead ? "text-3xl md:text-5xl" : "text-lg"
        )}
      >
        {title}
      </span>
      <span
        className={cn(
          "text-sm",
          isLead ? "text-brand-solid-foreground/80" : "text-muted-foreground"
        )}
      >
        {detail}
      </span>
    </span>
  )
}

function commitLabelOf(count: number) {
  return count === 1 ? "1 commit" : `${count} commits`
}

function TakenSeat({
  contributor,
  rank,
  isLead,
}: {
  contributor: GitHubContributor
  rank: number
  isLead: boolean
}) {
  return (
    <div
      className={cn(
        SEAT_BASE,
        "has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50",
        isLead
          ? LEAD_SEAT
          : cn(SEAT_SIZE, "border bg-card hover:border-foreground/25")
      )}
    >
      <RankMark rank={rank} isLead={isLead} />
      <span className="flex items-start justify-between gap-3">
        <ContributorAvatar
          login={contributor.login}
          sizePx={isLead ? 128 : 56}
          className={cn(
            isLead
              ? "size-24 border-0 ring-4 ring-brand-solid-foreground/20 md:size-32"
              : "size-14"
          )}
        />
        <span className="flex items-center gap-3">
          {isLead && (
            <span className="font-mono text-xs tracking-widest text-brand-solid-foreground/80 uppercase">
              Top contributor
            </span>
          )}
          <SeatArrow isLead={isLead} />
        </span>
      </span>
      <SeatText
        title={
          <a
            href={githubProfileOf(contributor.login)}
            target="_blank"
            rel="noreferrer"
            className="outline-none after:absolute after:inset-0"
          >
            @{contributor.login}
            <span className="sr-only">, GitHub profile</span>
          </a>
        }
        detail={
          <a
            href={mergedPullsOf(contributor.login)}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 underline-offset-4 outline-none hover:underline focus-visible:underline",
              isLead
                ? "hover:text-brand-solid-foreground"
                : "hover:text-foreground"
            )}
          >
            <GitMergeIcon aria-hidden className="size-3.5 shrink-0" />
            {commitLabelOf(contributor.contributions)}
            <span className="sr-only">, see their merged pull requests</span>
          </a>
        }
        isLead={isLead}
      />
    </div>
  )
}

function OpenSeat({ rank, isLead }: { rank: number; isLead: boolean }) {
  return (
    <a
      href="#join"
      className={cn(
        SEAT_BASE,
        isLead
          ? LEAD_SEAT
          : cn(
              SEAT_SIZE,
              "border border-dashed border-foreground/20 hover:border-foreground/45 hover:bg-muted/30"
            )
      )}
    >
      <RankMark rank={rank} isLead={isLead} />
      <span className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className={cn(
            "flex items-center justify-center rounded-full border border-dashed",
            isLead
              ? "size-24 border-brand-solid-foreground/50 md:size-32"
              : "size-14 border-foreground/25 text-muted-foreground transition-colors group-hover:border-foreground/50 group-hover:text-foreground"
          )}
        >
          <PlusIcon className={isLead ? "size-8" : "size-5"} />
        </span>
        <SeatArrow isLead={isLead} />
      </span>
      <SeatText
        title={isLead ? "The first seat is open" : "Open seat"}
        detail="Could be you"
        isLead={isLead}
      />
      <span className="sr-only">, see how to claim it</span>
    </a>
  )
}

export function ContributorWall({
  community,
}: {
  community: GitHubContributor[]
}) {
  const seatCount = community.length + openSeatsAfter(community.length)
  const ranks = Array.from({ length: seatCount }, (_, index) => index + 1)

  return (
    <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {ranks.map((rank) => {
        const contributor = community[rank - 1]
        const isLead = rank === 1

        return (
          <li key={rank} className={cn(isLead && "col-span-2 md:row-span-2")}>
            {contributor ? (
              <TakenSeat
                contributor={contributor}
                rank={rank}
                isLead={isLead}
              />
            ) : (
              <OpenSeat rank={rank} isLead={isLead} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
