"use client"

import * as React from "react"
import { Badge } from "@/registry/default/ui/badge"
import {
  KanbanBoard,
  type KanbanColumn,
} from "@/registry/default/ui/kanban-board"

interface Lead {
  id: string
  name: string
  company: string
  value: string
}

const STAGES: KanbanColumn[] = [
  { id: "lead", title: "New leads" },
  { id: "contacted", title: "Contacted" },
  { id: "negotiation", title: "Negotiation" },
  { id: "closed", title: "Closed won" },
]

const INITIAL_LEADS: Record<string, Lead[]> = {
  lead: [
    { id: "1", name: "Alex Chen", company: "Acme Corp", value: "$12k" },
    { id: "2", name: "Sarah Miller", company: "Starlight Inc", value: "$45k" },
  ],
  contacted: [
    { id: "3", name: "David Kim", company: "Nexus AI", value: "$28k" },
  ],
  negotiation: [],
  closed: [
    { id: "4", name: "Elena Rostova", company: "Hyperion Labs", value: "$60k" },
  ],
}

export function KanbanBoardOnMovePreview() {
  const [leads, setLeads] = React.useState(INITIAL_LEADS)
  const [lastMove, setLastMove] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3">
      <KanbanBoard
        aria-label="Sales pipeline"
        columns={STAGES}
        value={leads}
        onValueChange={setLeads}
        onMove={(lead, from, to, index) => {
          setLastMove(
            `Moved "${lead.name}" from ${from} to ${to} (index ${index})`
          )
        }}
        renderCard={(lead) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{lead.name}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {lead.value}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {lead.company}
            </span>
          </div>
        )}
      />
      {lastMove && (
        <p className="font-mono text-xs text-muted-foreground">{lastMove}</p>
      )}
    </div>
  )
}
