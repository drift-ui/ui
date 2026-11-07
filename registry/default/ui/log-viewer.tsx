"use client"

import * as React from "react"
import { ArrowDownIcon, SearchIcon, XIcon } from "lucide-react"

import { useControllableState } from "@/registry/default/hooks/use-controllable-state"
import {
  filterLogs,
  formatTimestamp,
  getLogLevels,
  parseAnsi,
  type AnsiColor,
  type AnsiSegment,
  type LogLevel,
  type LogLine,
} from "@/registry/default/lib/log-viewer"
import { cn } from "@/registry/default/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { VirtualList } from "@/registry/default/ui/virtual-list"

export type { AnsiColor, AnsiSegment, LogLevel, LogLine }

const ANSI_COLOR_CLASSES: Record<AnsiColor, string> = {
  black: "text-zinc-600 dark:text-zinc-400",
  red: "text-red-600 dark:text-red-400",
  green: "text-emerald-600 dark:text-emerald-400",
  yellow: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  magenta: "text-purple-600 dark:text-purple-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  white: "text-zinc-200 dark:text-zinc-100",
  "bright-black": "text-zinc-400 dark:text-zinc-500",
  "bright-red": "text-red-500 dark:text-red-300",
  "bright-green": "text-emerald-500 dark:text-emerald-300",
  "bright-yellow": "text-amber-500 dark:text-amber-300",
  "bright-blue": "text-blue-500 dark:text-blue-300",
  "bright-magenta": "text-purple-500 dark:text-purple-300",
  "bright-cyan": "text-cyan-500 dark:text-cyan-300",
  "bright-white": "text-white",
}

const ANSI_BG_CLASSES: Record<AnsiColor, string> = {
  black: "bg-zinc-800 text-zinc-100",
  red: "bg-red-500/20",
  green: "bg-emerald-500/20",
  yellow: "bg-amber-500/20",
  blue: "bg-blue-500/20",
  magenta: "bg-purple-500/20",
  cyan: "bg-cyan-500/20",
  white: "bg-zinc-200 dark:bg-zinc-700",
  "bright-black": "bg-zinc-700",
  "bright-red": "bg-red-500/30",
  "bright-green": "bg-emerald-500/30",
  "bright-yellow": "bg-amber-500/30",
  "bright-blue": "bg-blue-500/30",
  "bright-magenta": "bg-purple-500/30",
  "bright-cyan": "bg-cyan-500/30",
  "bright-white": "bg-white text-black",
}

const LEVEL_BADGE_CLASSES: Record<string, string> = {
  error: "bg-destructive/15 text-destructive border-destructive/20",
  warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  debug: "bg-muted text-muted-foreground border-border",
  trace: "bg-muted text-muted-foreground border-border",
}

function AnsiMessage({ message }: { message: string }) {
  const segments = React.useMemo(() => parseAnsi(message), [message])

  return (
    <span>
      {segments.map((segment, index) => {
        const { style } = segment
        const className = cn(
          style.color && ANSI_COLOR_CLASSES[style.color],
          style.backgroundColor && ANSI_BG_CLASSES[style.backgroundColor],
          style.bold && "font-bold",
          style.dim && "opacity-60",
          style.italic && "italic",
          style.underline && "underline",
          style.strikethrough && "line-through",
          style.inverse && "bg-foreground text-background"
        )

        return className ? (
          <span key={index} className={className}>
            {segment.text}
          </span>
        ) : (
          segment.text
        )
      })}
    </span>
  )
}

export interface LogViewerProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  lines: LogLine[]
  follow?: boolean
  defaultFollow?: boolean
  onFollowChange?: (follow: boolean) => void
  searchable?: boolean
  search?: string
  defaultSearch?: string
  onSearchChange?: (search: string) => void
  filterable?: boolean
  level?: string
  defaultLevel?: string
  onLevelChange?: (level: string) => void
  showLineNumbers?: boolean
  showTimestamps?: boolean
  rowHeight?: number
  height?: number | string
  emptyMessage?: React.ReactNode
}

function LogViewer({
  lines = [],
  follow: followProp,
  defaultFollow = true,
  onFollowChange,
  searchable = true,
  search: searchProp,
  defaultSearch = "",
  onSearchChange,
  filterable = true,
  level: levelProp,
  defaultLevel = "all",
  onLevelChange,
  showLineNumbers = true,
  showTimestamps = true,
  rowHeight = 24,
  height = 400,
  emptyMessage = "No log lines matching criteria",
  className,
  ...props
}: LogViewerProps) {
  const listRef = React.useRef<HTMLDivElement>(null)

  const { value: follow, setValue: setFollow } = useControllableState<boolean>({
    value: followProp,
    defaultValue: defaultFollow,
    onChange: onFollowChange,
  })

  const { value: search, setValue: setSearch } = useControllableState<string>({
    value: searchProp,
    defaultValue: defaultSearch,
    onChange: onSearchChange,
  })

  const { value: level, setValue: setLevel } = useControllableState<string>({
    value: levelProp,
    defaultValue: defaultLevel,
    onChange: onLevelChange,
  })

  const availableLevels = React.useMemo(() => getLogLevels(lines), [lines])
  const filteredLines = React.useMemo(
    () => filterLogs(lines, { search, level }),
    [lines, search, level]
  )

  React.useEffect(() => {
    if (!follow || !listRef.current) return
    const container = listRef.current
    container.scrollTop = container.scrollHeight
  }, [follow, filteredLines.length])

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    const isAtBottom = distanceFromBottom <= 24

    if (follow && !isAtBottom) {
      setFollow(false)
    } else if (!follow && isAtBottom) {
      setFollow(true)
    }
  }

  const handleJumpToLatest = () => {
    setFollow(true)
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }

  return (
    <div
      data-slot="log-viewer"
      role="region"
      aria-label="Log viewer"
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 p-2">
        <div className="flex min-w-48 flex-1 items-center gap-2">
          {searchable && (
            <div className="relative max-w-xs flex-1">
              <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="h-8 pr-7 pl-8 text-xs"
                aria-label="Search logs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          )}

          {filterable && availableLevels.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto">
              <Button
                type="button"
                size="sm"
                variant={level === "all" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setLevel("all")}
              >
                All
              </Button>
              {availableLevels.map((lvl) => (
                <Button
                  key={lvl}
                  type="button"
                  size="sm"
                  variant={level.toLowerCase() === lvl ? "secondary" : "ghost"}
                  className="h-7 px-2 text-xs capitalize"
                  onClick={() => setLevel(lvl)}
                >
                  {lvl}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="select-none">
            {filteredLines.length !== lines.length
              ? `${filteredLines.length} of ${lines.length} lines`
              : `${lines.length} lines`}
          </span>

          <Button
            type="button"
            size="sm"
            variant={follow ? "secondary" : "ghost"}
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setFollow(!follow)}
            aria-label={follow ? "Pause auto-scroll" : "Resume auto-scroll"}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                follow ? "animate-pulse bg-emerald-500" : "bg-muted-foreground"
              )}
            />
            Follow
          </Button>
        </div>
      </div>

      <div
        className="relative flex-1"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {filteredLines.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <VirtualList
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Log lines"
            items={filteredLines}
            estimateSize={rowHeight}
            getItemKey={(item) => item.id}
            onScroll={handleScroll}
            className="h-full bg-zinc-950 text-zinc-100"
          >
            {(line, index) => (
              <div
                className="flex items-center gap-3 overflow-x-auto px-3 font-mono text-xs whitespace-pre select-text hover:bg-zinc-900"
                style={{ height: `${rowHeight}px` }}
              >
                {showLineNumbers && (
                  <span className="w-10 shrink-0 text-right text-zinc-500 tabular-nums select-none">
                    {index + 1}
                  </span>
                )}
                {showTimestamps && line.timestamp && (
                  <span className="shrink-0 text-zinc-500 select-none">
                    {formatTimestamp(line.timestamp)}
                  </span>
                )}
                {line.level && (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase select-none",
                      LEVEL_BADGE_CLASSES[line.level.toLowerCase()] ??
                        "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {line.level.toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <AnsiMessage message={line.message} />
                </span>
              </div>
            )}
          </VirtualList>
        )}

        {!follow && filteredLines.length > 0 && (
          <div className="absolute right-4 bottom-3 z-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleJumpToLatest}
              className="h-7 gap-1.5 text-xs shadow-md"
            >
              <ArrowDownIcon className="size-3.5" />
              Jump to latest
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export { LogViewer }
