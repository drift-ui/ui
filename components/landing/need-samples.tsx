"use client"

import * as React from "react"
import { CircleDotIcon, TextIcon } from "lucide-react"

import type { Filter, FilterField } from "@/registry/default/lib/filter"
import { CronInput } from "@/registry/default/ui/cron-input"
import { DateTimeRangePicker } from "@/registry/default/ui/date-time-range"
import { DiffViewer } from "@/registry/default/ui/diff-viewer"
import { FilterBuilder } from "@/registry/default/ui/filter-builder"
import { Label } from "@/registry/default/ui/label"
import { TagsInput } from "@/registry/default/ui/tags-input"

function TagsSample() {
  const id = React.useId()

  return (
    <>
      <Label htmlFor={id} className="sr-only">
        Regions
      </Label>
      <TagsInput
        id={id}
        defaultValue={["eu-west-1", "canary"]}
        placeholder="Add region"
      />
    </>
  )
}

const RELEASE_WINDOW = {
  from: new Date(2026, 10, 9, 9, 30),
  to: new Date(2026, 10, 13, 17, 45),
}

function DateRangeSample() {
  const id = React.useId()

  return (
    <>
      <Label htmlFor={id} className="sr-only">
        Release window
      </Label>
      <DateTimeRangePicker
        id={id}
        locale="en-US"
        defaultValue={RELEASE_WINDOW}
        className="w-full"
      />
    </>
  )
}

function CronSample() {
  return (
    <CronInput
      defaultValue="0 9 * * 1-5"
      showNextRuns={false}
      inputProps={{ "aria-label": "Job schedule" }}
    />
  )
}

function DiffSample() {
  return (
    <DiffViewer
      aria-label="Changes to deploy.yaml"
      oldValue={"replicas: 2\ntimeout: 30s"}
      newValue={"replicas: 4\ntimeout: 60s"}
      className="text-xs"
    />
  )
}

const FILTER_FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    icon: <CircleDotIcon />,
    options: [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
  { id: "title", label: "Title", type: "text", icon: <TextIcon /> },
]

const OPEN_ISSUES: Filter[] = [
  { id: "status-open", fieldId: "status", operator: "is", value: "open" },
]

function FilterSample() {
  return (
    <FilterBuilder
      aria-label="Issue filters"
      fields={FILTER_FIELDS}
      defaultValue={OPEN_ISSUES}
    />
  )
}

const SAMPLES: Record<string, () => React.ReactNode> = {
  "tags-input": TagsSample,
  "date-time-range": DateRangeSample,
  "cron-input": CronSample,
  "diff-viewer": DiffSample,
  "filter-builder": FilterSample,
}

export function NeedSample({ slug }: { slug: string }) {
  const Sample = SAMPLES[slug]
  return Sample ? <Sample /> : null
}
