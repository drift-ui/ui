"use client"

import { useState } from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { LazyCodeFrame } from "@/components/docs/lazy-code-frame"
import { TabsRail } from "@/components/docs/tabs-rail"

function fileName(title: string) {
  return title.split("/").pop() ?? title
}

export function SourceFiles({
  src,
  titles,
}: {
  src: string
  titles: string[]
}) {
  const [activeFile, setActiveFile] = useState(titles[0] ?? "")

  if (titles.length === 1)
    return <LazyCodeFrame src={src} title={titles[0]} collapsible />

  return (
    <TabsPrimitive.Root value={activeFile} onValueChange={setActiveFile}>
      <TabsRail
        items={titles.map((title) => ({
          value: title,
          label: fileName(title),
        }))}
        value={activeFile}
        label="Source files"
        triggerClassName="font-mono text-xs"
        className="overflow-x-auto"
      />
      {titles.map((title) => (
        <TabsPrimitive.Content
          key={title}
          value={title}
          className="mt-3 outline-none"
        >
          <LazyCodeFrame src={src} title={title} collapsible />
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
