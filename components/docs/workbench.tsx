"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { useDocsSections } from "@/components/docs/docs-sections"
import { TabsRail } from "@/components/docs/tabs-rail"

export type WorkbenchPanel = {
  value: string
  label: string
  content: React.ReactNode
}

const STUCK_BAR_BOTTOM = 112

export function Workbench({
  preview,
  panels,
}: {
  preview: React.ReactNode
  panels: WorkbenchPanel[]
}) {
  const dockRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState(panels[0]?.value ?? "")
  const [, setSections] = useDocsSections()

  useEffect(() => {
    function openHashTarget() {
      const target = document.getElementById(
        decodeURIComponent(window.location.hash.slice(1))
      )
      const panel =
        target?.closest<HTMLElement>("[data-dock-panel]")?.dataset.dockPanel
      if (!target || !panel) return

      setTab(panel)
      requestAnimationFrame(() => target.scrollIntoView({ block: "start" }))
    }

    openHashTarget()
    window.addEventListener("hashchange", openHashTarget)
    return () => window.removeEventListener("hashchange", openHashTarget)
  }, [])

  const selectTab = useCallback((value: string) => {
    setTab(value)
    window.history.replaceState(null, "", `#${value}`)
    const top = dockRef.current?.getBoundingClientRect().top ?? 0
    if (top < STUCK_BAR_BOTTOM || top > window.innerHeight * 0.6) {
      dockRef.current?.scrollIntoView({ block: "start" })
    }
  }, [])

  useEffect(() => {
    setSections({
      items: panels.map(({ value, label }) => ({ value, label })),
      active: tab,
      open: selectTab,
    })
  }, [panels, tab, selectTab, setSections])

  useEffect(() => () => setSections(null), [setSections])

  return (
    <TabsPrimitive.Root
      value={tab}
      onValueChange={selectTab}
      className="flex flex-col overflow-clip rounded-2xl border"
    >
      <div className="flex flex-col">{preview}</div>
      <div className="sticky top-16 z-20 flex h-11 scrollbar-none items-center overflow-x-auto border-y bg-background/90 px-2 backdrop-blur-md">
        <TabsRail
          items={panels.map(({ value, label }) => ({ value, label }))}
          value={tab}
          label="Documentation"
        />
      </div>
      <div ref={dockRef} className="scroll-mt-28">
        {panels.map((panel) => (
          <TabsPrimitive.Content
            key={panel.value}
            value={panel.value}
            forceMount
            data-dock-panel={panel.value}
            className="px-4 py-6 outline-none data-[state=inactive]:hidden md:px-8 md:py-8"
          >
            <div id={panel.value} className="scroll-mt-32">
              {panel.content}
            </div>
          </TabsPrimitive.Content>
        ))}
      </div>
    </TabsPrimitive.Root>
  )
}
