"use client"

import { SegmentedControl } from "@/components/docs/segmented-control"
import { useUrlFilters } from "@/lib/use-url-filters"

const ALL = "all"

type Tab = {
  id: string
  label: string
  count: number
  content: React.ReactNode
}

function groupToParams(group: string) {
  const params = new URLSearchParams()
  if (group !== ALL) params.set("group", group)

  return params
}

export function BlocksTabs({ tabs }: { tabs: Tab[] }) {
  const [activeGroup, setActiveGroup] = useUrlFilters((search) => {
    const group = new URLSearchParams(search).get("group")

    return tabs.find(({ id }) => id === group)?.id ?? ALL
  }, groupToParams)

  const items = [
    {
      id: ALL,
      label: "All",
      count: tabs.reduce((total, tab) => total + tab.count, 0),
    },
    ...tabs,
  ].map(({ id, label, count }) => ({
    value: id,
    label: (
      <>
        {label}
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {count}
        </span>
      </>
    ),
  }))

  return (
    <div className="flex flex-col gap-16">
      <div className="sticky top-16 z-20 border-b border-border/60 bg-background/80 py-3 backdrop-blur-md">
        <SegmentedControl
          items={items}
          value={activeGroup}
          onValueChange={setActiveGroup}
          label="Filter by group"
          className="-mx-1 scrollbar-none overflow-x-auto px-1"
        />
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          hidden={activeGroup !== ALL && activeGroup !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
