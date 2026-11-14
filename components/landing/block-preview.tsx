import { ChevronDownIcon, LaptopIcon, SmartphoneIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/registry/default/ui/avatar"
import {
  AvatarGroup,
  AvatarGroupItem,
} from "@/registry/default/ui/avatar-group"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { CommentThread } from "@/registry/default/ui/comment-thread"
import {
  DescriptionItem,
  DescriptionList,
} from "@/registry/default/ui/description-list"
import { DiffViewer } from "@/registry/default/ui/diff-viewer"
import { Label } from "@/registry/default/ui/label"
import { LogViewer, type LogLine } from "@/registry/default/ui/log-viewer"
import { MultiSelect } from "@/registry/default/ui/multi-select"
import {
  PermissionMatrix,
  type PermissionGroup,
  type PermissionRole,
} from "@/registry/default/ui/permission-matrix"
import { PhoneInput } from "@/registry/default/ui/phone-input"
import { SecretField } from "@/registry/default/ui/secret-field"
import { TimezonePicker } from "@/registry/default/ui/timezone-picker"
import {
  TraceWaterfall,
  type Span,
} from "@/registry/default/ui/trace-waterfall"
import { UptimeBar } from "@/registry/default/ui/uptime-bar"
import type { Comment } from "@/registry/default/lib/comment-thread-utils"
import type { UptimeDay } from "@/registry/default/lib/uptime-bar-utils"
import { DateRangeSpecimen } from "@/components/landing/specimens/date-range-specimen"
import { FileDropzoneSpecimen } from "@/components/landing/specimens/file-dropzone-specimen"
import { NumberInputSpecimen } from "@/components/landing/specimens/number-input-specimen"
import { PasswordInputSpecimen } from "@/components/landing/specimens/password-input-specimen"
import { StepperSpecimen } from "@/components/landing/specimens/stepper-specimen"
import { TagsInputSpecimen } from "@/components/landing/specimens/tags-input-specimen"
import { TimelineSpecimen } from "@/components/landing/specimens/timeline-specimen"
import { TreeViewSpecimen } from "@/components/landing/specimens/tree-view-specimen"
import type { BlockKind } from "@/lib/blocks"

const SESSIONS = [
  { device: "MacBook Pro, Lisbon", meta: "This device", Icon: LaptopIcon },
  { device: "Pixel 9, Porto", meta: "2 hours ago", Icon: SmartphoneIcon },
]

const UPTIME_INCIDENTS: Record<number, Omit<UptimeDay, "date">> = {
  18: { status: "down", uptime: 92.1, note: "Webhook queue stalled" },
  41: { status: "degraded", uptime: 98.7, note: "Slow database failover" },
}

const UPTIME_DAYS: UptimeDay[] = Array.from({ length: 60 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 8, 1 + index)).toISOString().slice(0, 10),
  ...(UPTIME_INCIDENTS[index] ?? { status: "operational", uptime: 100 }),
}))

const INCIDENT_LOGS: LogLine[] = [
  {
    id: "1",
    level: "info",
    message: "worker-3 picked up evt_9942",
  },
  {
    id: "2",
    level: "error",
    message: "evt_9942 timed out after 5000ms",
  },
  {
    id: "3",
    level: "warn",
    message: "retry 1 for evt_9942 in 30s",
  },
  { id: "4", level: "info", message: "evt_9942 delivered" },
]

const TRACE_SPANS: Span[] = [
  {
    id: "root",
    name: "POST /checkout",
    start: 0,
    duration: 320,
    service: "api",
  },
  {
    id: "payment",
    parentId: "root",
    name: "stripe.charge",
    start: 60,
    duration: 180,
    service: "payments",
    status: "error",
  },
  {
    id: "mail",
    parentId: "root",
    name: "email.send",
    start: 250,
    duration: 50,
    service: "mailer",
  },
]

const API_SCOPES = [
  { value: "read:projects", label: "read:projects" },
  { value: "write:deploys", label: "write:deploys" },
  { value: "read:billing", label: "read:billing" },
]

const CONFIG_BEFORE = `service: billing
replicas: 2
region: eu-west-1`

const CONFIG_AFTER = `service: billing
replicas: 4
region: eu-central-1`

const REVIEW_NOW = new Date(Date.UTC(2026, 10, 9, 12, 0))

const REVIEW_COMMENTS: Comment[] = [
  {
    id: "1",
    author: { id: "noor", name: "Noor Haddad" },
    body: "Does eu-central-1 have the read replica yet?",
    createdAt: new Date(Date.UTC(2026, 10, 9, 10, 0)),
  },
  {
    id: "2",
    parentId: "1",
    author: { id: "tomasz", name: "Tomasz Wierzba" },
    body: "Since Friday. Doubling replicas covers the move.",
    createdAt: new Date(Date.UTC(2026, 10, 9, 11, 30)),
  },
]

const ROLES: PermissionRole[] = [
  { id: "editor", name: "Editor" },
  { id: "admin", name: "Admin", inheritsFrom: "editor" },
]

const PERMISSIONS: PermissionGroup[] = [
  {
    id: "projects",
    name: "Projects",
    permissions: [
      { id: "projects.view", name: "View" },
      { id: "projects.edit", name: "Edit" },
      { id: "projects.delete", name: "Delete" },
    ],
  },
]

const GRANTS = {
  editor: ["projects.view", "projects.edit"],
  admin: ["projects.delete"],
}

const ADMINS = ["Ana Lima", "Kenji Sato", "Priya Nair", "Lea Becker"]

function BlockTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  )
}

export function BlockPreview({ kind }: { kind: BlockKind }) {
  switch (kind) {
    case "onboarding":
      return (
        <div className="flex flex-col gap-5">
          <StepperSpecimen />
          <div className="grid gap-2">
            <Label>Teams</Label>
            <TagsInputSpecimen tags={["platform", "design"]} draft="Add team" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="grid gap-2">
              <Label>Seats</Label>
              <NumberInputSpecimen />
            </div>
            <Button size="sm">Continue</Button>
          </div>
        </div>
      )
    case "team-invite":
      return (
        <div className="flex flex-col gap-4">
          <BlockTitle
            title="Invite your team"
            detail="They get an email with a join link."
          />
          <TagsInputSpecimen
            tags={["ilse@ledgerline.dev", "noor@ledgerline.dev"]}
            draft="Add email"
          />
          <div className="flex items-center justify-between">
            <span className="flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs">
              Member{" "}
              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            </span>
            <Button size="sm">Send 2 invites</Button>
          </div>
        </div>
      )
    case "security":
      return (
        <div className="flex flex-col gap-4">
          <BlockTitle
            title="Change password"
            detail="Signs out every other session."
          />
          <PasswordInputSpecimen />
          <ul className="flex flex-col divide-y rounded-md border">
            {SESSIONS.map(({ device, meta, Icon }) => (
              <li
                key={device}
                className="flex items-center gap-2.5 px-3 py-2 text-xs"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1">{device}</span>
                <span className="text-muted-foreground">{meta}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    case "file-manager":
      return (
        <div className="grid gap-4 @md:grid-cols-[1fr_1.2fr]">
          <TreeViewSpecimen />
          <FileDropzoneSpecimen />
        </div>
      )
    case "release":
      return (
        <div className="grid gap-5">
          <BlockTitle title="Schedule release" detail="v2.14.0 to production" />
          <DateRangeSpecimen />
          <TimelineSpecimen />
        </div>
      )
    case "profile":
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>RK</AvatarFallback>
            </Avatar>
            <BlockTitle title="Riya Kapoor" detail="riya@ledgerline.dev" />
          </div>
          <DescriptionList>
            <DescriptionItem label="Team" editable>
              Payments
            </DescriptionItem>
            <DescriptionItem label="Plan">
              <Badge variant="secondary">Pro</Badge>
            </DescriptionItem>
          </DescriptionList>
          <div className="grid gap-3 @md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Mobile</Label>
              <PhoneInput defaultValue="+351912345678" defaultCountry="PT" />
            </div>
            <div className="grid gap-2">
              <Label>Time zone</Label>
              <TimezonePicker defaultValue="Europe/Lisbon" />
            </div>
          </div>
        </div>
      )
    case "service-status":
      return (
        <div className="flex flex-col gap-4">
          <UptimeBar title="Webhooks" days={UPTIME_DAYS} />
          <LogViewer
            lines={INCIDENT_LOGS}
            height={120}
            searchable={false}
            filterable={false}
          />
        </div>
      )
    case "trace-inspector":
      return (
        <div className="flex flex-col gap-4">
          <TraceWaterfall
            spans={TRACE_SPANS}
            defaultExpandedSpanIds={["root"]}
            defaultSelectedSpanId="payment"
          />
        </div>
      )
    case "api-keys":
      return (
        <div className="flex flex-col gap-4">
          <BlockTitle
            title="Deploy bot"
            detail="Created Oct 12 by Riya Kapoor"
          />
          <div className="grid gap-2">
            <Label>Secret key</Label>
            <SecretField value="sk_live_51Mz8Qk2xPa1b2" />
          </div>
          <div className="grid gap-2">
            <Label>Scopes</Label>
            <MultiSelect
              options={API_SCOPES}
              defaultValue={["read:projects", "write:deploys"]}
              placeholder="Add scope"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline">
              Revoke
            </Button>
            <Button size="sm">Save</Button>
          </div>
        </div>
      )
    case "code-review":
      return (
        <div className="flex flex-col gap-4">
          <DiffViewer
            aria-label="Changes to billing.yaml"
            oldValue={CONFIG_BEFORE}
            newValue={CONFIG_AFTER}
            mode="unified"
          />
          <CommentThread
            aria-label="Review thread on billing.yaml"
            defaultComments={REVIEW_COMMENTS}
            now={REVIEW_NOW}
          />
        </div>
      )
    case "roles":
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <BlockTitle title="Admins" detail="4 people hold this role" />
            <AvatarGroup aria-label="Admins" max={3}>
              {ADMINS.map((name) => (
                <AvatarGroupItem key={name} name={name} />
              ))}
            </AvatarGroup>
          </div>
          <PermissionMatrix
            roles={ROLES}
            permissions={PERMISSIONS}
            defaultValue={GRANTS}
          />
        </div>
      )
    case "audit-log":
      return (
        <div className="flex flex-col gap-4">
          <TagsInputSpecimen
            tags={["actor:noor", "action:deploy"]}
            draft="Add filter"
          />
          <TimelineSpecimen />
        </div>
      )
  }
}
