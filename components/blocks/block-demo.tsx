"use client"

import * as React from "react"
import {
  ArchiveIcon,
  FileIcon,
  FolderIcon,
  LaptopIcon,
  MonitorIcon,
  SmartphoneIcon,
} from "lucide-react"

import { cn } from "@/registry/default/lib/utils"
import { Avatar, AvatarFallback } from "@/registry/default/ui/avatar"
import {
  AvatarGroup,
  AvatarGroupItem,
} from "@/registry/default/ui/avatar-group"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { CommentThread } from "@/registry/default/ui/comment-thread"
import { DateTimeRangePicker } from "@/registry/default/ui/date-time-range"
import {
  DescriptionItem,
  DescriptionList,
} from "@/registry/default/ui/description-list"
import { DiffViewer, type DiffMode } from "@/registry/default/ui/diff-viewer"
import {
  FileDropzone,
  FileDropzoneItem,
  FileDropzoneList,
} from "@/registry/default/ui/file-dropzone"
import { Input } from "@/registry/default/ui/input"
import { JsonViewer } from "@/registry/default/ui/json-viewer"
import { Label } from "@/registry/default/ui/label"
import { LogViewer, type LogLine } from "@/registry/default/ui/log-viewer"
import { MultiSelect } from "@/registry/default/ui/multi-select"
import { NumberInput } from "@/registry/default/ui/number-input"
import {
  PasswordInput,
  PasswordStrength,
} from "@/registry/default/ui/password-input"
import {
  PermissionMatrix,
  type PermissionGroup,
  type PermissionRole,
} from "@/registry/default/ui/permission-matrix"
import { PhoneInput } from "@/registry/default/ui/phone-input"
import { SecretField } from "@/registry/default/ui/secret-field"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrevious,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/registry/default/ui/stepper"
import { TagsInput } from "@/registry/default/ui/tags-input"
import {
  Timeline,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/registry/default/ui/timeline"
import { TimezonePicker } from "@/registry/default/ui/timezone-picker"
import {
  TraceWaterfall,
  type Span,
} from "@/registry/default/ui/trace-waterfall"
import { TreeView, type TreeNode } from "@/registry/default/ui/tree-view"
import { UptimeBar } from "@/registry/default/ui/uptime-bar"
import type { Comment } from "@/registry/default/lib/comment-thread"
import type { UptimeDay } from "@/registry/default/lib/uptime-bar"
import type { BlockKind } from "@/lib/blocks"

function Screen({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string
  description: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-6 p-5 @xl:p-8", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const ONBOARDING_STEPS = ["Workspace", "Teams", "Seats"]

function OnboardingDemo() {
  const id = React.useId()
  const [teams, setTeams] = React.useState(["platform", "design"])
  const [seats, setSeats] = React.useState<number | null>(12)

  return (
    <Screen
      title="Set up your workspace"
      description="Three steps, and you can change all of it later in settings."
    >
      <Stepper stepCount={ONBOARDING_STEPS.length} className="gap-8">
        <StepperList aria-label="Setup steps">
          {ONBOARDING_STEPS.map((step, index) => (
            <StepperItem key={step} step={index}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>{step}</StepperTitle>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
          ))}
        </StepperList>
        <StepperContent step={0} className="grid gap-5">
          <Field label="Workspace name" htmlFor={`${id}-name`}>
            <Input id={`${id}-name`} defaultValue="Ledgerline" />
          </Field>
          <Field
            label="URL"
            htmlFor={`${id}-url`}
            hint="Lowercase letters, numbers and dashes."
          >
            <Input id={`${id}-url`} defaultValue="ledgerline" />
          </Field>
        </StepperContent>
        <StepperContent step={1} className="grid gap-5">
          <Field
            label="Teams"
            hint="Press Enter or comma after each one. Paste a list to add several."
          >
            <TagsInput
              value={teams}
              onValueChange={setTeams}
              placeholder="Add team"
            />
          </Field>
        </StepperContent>
        <StepperContent step={2} className="grid gap-5">
          <Field label="Seats" hint="Billed monthly at $8 per seat.">
            <NumberInput
              aria-label="Seats"
              value={seats}
              onValueChange={setSeats}
              min={1}
              max={500}
              className="w-40"
            />
          </Field>
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            {teams.length} teams, {seats ?? 0} seats:{" "}
            <span className="font-medium tabular-nums">
              ${(seats ?? 0) * 8}/month
            </span>
          </p>
        </StepperContent>
        <div className="flex justify-between border-t pt-5">
          <StepperPrevious asChild>
            <Button variant="outline">Back</Button>
          </StepperPrevious>
          <StepperNext asChild>
            <Button>Continue</Button>
          </StepperNext>
        </div>
      </Stepper>
    </Screen>
  )
}

const PENDING_INVITES = [
  { email: "kenji@ledgerline.dev", role: "Admin", sent: "2 days ago" },
  { email: "lea@ledgerline.dev", role: "Member", sent: "5 days ago" },
]

const ROLE_OPTIONS = ["Member", "Admin"] as const

function TeamInviteDemo() {
  const [emails, setEmails] = React.useState([
    "ilse@ledgerline.dev",
    "noor@ledgerline.dev",
  ])
  const [role, setRole] = React.useState<(typeof ROLE_OPTIONS)[number]>(
    ROLE_OPTIONS[0]
  )

  return (
    <Screen
      title="Invite your team"
      description="Each person gets an email with a join link that expires in 7 days."
    >
      <div className="grid gap-4">
        <Field label="Email addresses" hint="Paste a list from a spreadsheet.">
          <TagsInput
            value={emails}
            onValueChange={setEmails}
            placeholder="Add email"
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="radiogroup"
            aria-label="Role"
            className="flex rounded-md border p-0.5"
          >
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={role === option}
                onClick={() => setRole(option)}
                className="rounded-sm px-3 py-1 text-sm text-muted-foreground aria-checked:bg-muted aria-checked:text-foreground"
              >
                {option}
              </button>
            ))}
          </div>
          <Button disabled={emails.length === 0}>
            Send {emails.length} {emails.length === 1 ? "invite" : "invites"}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">Pending</h4>
        <ul className="divide-y rounded-lg border">
          {PENDING_INVITES.map((invite) => (
            <li
              key={invite.email}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <Avatar className="size-8">
                <AvatarFallback>
                  {invite.email.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate">{invite.email}</span>
              <Badge variant="secondary">{invite.role}</Badge>
              <span className="hidden text-muted-foreground @md:inline">
                {invite.sent}
              </span>
              <Button variant="ghost" size="sm">
                Resend
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  )
}

function ProfileDemo() {
  const id = React.useId()
  const [team, setTeam] = React.useState("Payments")
  const [title, setTitle] = React.useState("Staff engineer")

  return (
    <Screen
      title="Profile"
      description="How you appear to your team, and where notifications reach you."
      actions={<Button>Save changes</Button>}
    >
      <div className="grid gap-8 @3xl:grid-cols-[14rem_1fr]">
        <div className="flex flex-col items-start gap-3">
          <Avatar className="size-20 text-xl">
            <AvatarFallback>RK</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">Riya Kapoor</p>
            <p className="text-sm text-muted-foreground">riya@ledgerline.dev</p>
          </div>
          <Button variant="outline" size="sm">
            Change photo
          </Button>
        </div>
        <div className="flex flex-col gap-6">
          <DescriptionList>
            <DescriptionItem label="User ID" copyable>
              <span className="font-mono">usr_8f2a</span>
            </DescriptionItem>
            <DescriptionItem label="Title" editable onValueChange={setTitle}>
              {title}
            </DescriptionItem>
            <DescriptionItem label="Team" editable onValueChange={setTeam}>
              {team}
            </DescriptionItem>
            <DescriptionItem label="Plan">
              <Badge variant="secondary">Pro</Badge>
            </DescriptionItem>
          </DescriptionList>
          <div className="grid gap-5 @xl:grid-cols-2">
            <Field label="Mobile" htmlFor={`${id}-phone`}>
              <PhoneInput
                id={`${id}-phone`}
                defaultValue="+351912345678"
                defaultCountry="PT"
              />
            </Field>
            <Field label="Time zone" htmlFor={`${id}-tz`}>
              <TimezonePicker id={`${id}-tz`} defaultValue="Europe/Lisbon" />
            </Field>
          </div>
        </div>
      </div>
    </Screen>
  )
}

const SESSIONS = [
  {
    device: "MacBook Pro, Lisbon",
    meta: "This device",
    Icon: LaptopIcon,
    current: true,
  },
  { device: "Pixel 9, Porto", meta: "2 hours ago", Icon: SmartphoneIcon },
  { device: "Windows desktop, Madrid", meta: "3 days ago", Icon: MonitorIcon },
]

function SecurityDemo() {
  const id = React.useId()
  const [password, setPassword] = React.useState("Copper-lantern9")
  const [sessions, setSessions] = React.useState(SESSIONS)

  return (
    <Screen
      title="Security"
      description="Changing your password signs out every other session."
    >
      <div className="grid gap-8 @3xl:grid-cols-2">
        <div className="grid content-start gap-5">
          <Field label="Current password" htmlFor={`${id}-current`}>
            <PasswordInput
              id={`${id}-current`}
              autoComplete="current-password"
              defaultValue="old-password"
            />
          </Field>
          <Field label="New password" htmlFor={`${id}-new`}>
            <PasswordInput
              id={`${id}-new`}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordStrength value={password} />
          </Field>
          <Button className="w-fit" disabled={password.length < 8}>
            Update password
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Active sessions</h4>
          <ul className="divide-y rounded-lg border">
            {sessions.map(({ device, meta, Icon, current }) => (
              <li
                key={device}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{device}</span>
                  <span className="text-xs text-muted-foreground">{meta}</span>
                </span>
                {!current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSessions((all) =>
                        all.filter((session) => session.device !== device)
                      )
                    }
                  >
                    Sign out
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Screen>
  )
}

const RELEASE_EVENTS = [
  {
    title: "Deploy window booked",
    meta: "Riya Kapoor, 15:02",
    variant: "current",
  },
  {
    title: "Review approved",
    meta: "Tomasz Wierzba, 13:58",
    variant: "success",
  },
  { title: "Preview build passed", meta: "CI, 13:41", variant: "success" },
  {
    title: "Release branch cut",
    meta: "Noor Haddad, 11:20",
    variant: "default",
  },
] as const

const RELEASE_PRESETS = [
  {
    label: "Tonight",
    value: {
      from: new Date(2026, 10, 10, 22, 0),
      to: new Date(2026, 10, 10, 23, 30),
    },
  },
  {
    label: "Weekend",
    value: {
      from: new Date(2026, 10, 14, 9, 0),
      to: new Date(2026, 10, 15, 18, 0),
    },
  },
]

function ReleaseDemo() {
  const id = React.useId()

  return (
    <Screen
      title="Schedule release"
      description="v2.14.0 to production"
      actions={<Badge variant="secondary">Awaiting window</Badge>}
    >
      <div className="grid gap-8 @2xl:grid-cols-[1fr_16rem]">
        <div className="grid content-start gap-5">
          <Field
            label="Deploy window"
            htmlFor={`${id}-window`}
            hint='Type a range like "tomorrow 9am to 5pm" or pick from the calendar.'
          >
            <DateTimeRangePicker
              id={`${id}-window`}
              presets={RELEASE_PRESETS}
              defaultValue={RELEASE_PRESETS[0].value}
              className="max-w-none"
            />
          </Field>
          <Button className="w-fit">Schedule</Button>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium">Activity</h4>
          <Timeline>
            {RELEASE_EVENTS.map((event) => (
              <TimelineItem key={event.title} className="pb-5">
                <TimelineIndicator variant={event.variant} />
                <TimelineContent className="gap-0.5">
                  <TimelineTitle className="text-sm">
                    {event.title}
                  </TimelineTitle>
                  <TimelineTime className="text-xs">{event.meta}</TimelineTime>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      </div>
    </Screen>
  )
}

const UPTIME_INCIDENTS: Record<number, Omit<UptimeDay, "date">> = {
  47: { status: "down", uptime: 92.1, note: "Webhook queue stalled" },
  71: { status: "degraded", uptime: 98.7, note: "Slow database failover" },
}

const UPTIME_DAYS: UptimeDay[] = Array.from({ length: 90 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 7, 12 + index)).toISOString().slice(0, 10),
  ...(UPTIME_INCIDENTS[index] ?? { status: "operational", uptime: 100 }),
}))

const INCIDENT_LOGS: LogLine[] = [
  { id: "1", level: "info", message: "worker-3 picked up evt_9942" },
  { id: "2", level: "debug", message: "POST https://hooks.acme.dev/billing" },
  {
    id: "3",
    level: "error",
    message: "\u001b[31m[error]\u001b[0m evt_9942 timed out after 5000ms",
  },
  {
    id: "4",
    level: "warn",
    message: "\u001b[33m[retry]\u001b[0m attempt 1 for evt_9942 in 30s",
  },
  { id: "5", level: "info", message: "queue depth 1,284 (threshold 1,000)" },
  {
    id: "6",
    level: "error",
    message: "\u001b[31m[error]\u001b[0m evt_9951 timed out after 5000ms",
  },
  { id: "7", level: "info", message: "scaled webhook workers 4 → 8" },
  {
    id: "8",
    level: "info",
    message: "\u001b[32m✓\u001b[0m evt_9942 delivered on attempt 2",
  },
  { id: "9", level: "info", message: "queue depth 212" },
]

function ServiceStatusDemo() {
  return (
    <Screen
      title="Webhooks"
      description="Outbound event delivery for every workspace."
      actions={<Badge variant="secondary">Operational</Badge>}
    >
      <UptimeBar title="Last 90 days" days={UPTIME_DAYS} />
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">Incident on Sep 28</h4>
        <LogViewer lines={INCIDENT_LOGS} height={260} showLineNumbers />
      </div>
    </Screen>
  )
}

const TRACE_SPANS: Span[] = [
  {
    id: "root",
    name: "POST /checkout",
    start: 0,
    duration: 320,
    service: "api-gateway",
    attributes: { "http.method": "POST", "http.status_code": 402 },
  },
  {
    id: "auth",
    parentId: "root",
    name: "jwt.verify",
    start: 12,
    duration: 28,
    service: "api-gateway",
  },
  {
    id: "inventory",
    parentId: "root",
    name: "inventory.checkStock",
    start: 45,
    duration: 65,
    service: "inventory-svc",
  },
  {
    id: "db",
    parentId: "inventory",
    name: "SELECT items FROM inventory",
    start: 52,
    duration: 48,
    service: "postgres",
    attributes: { "db.system": "postgresql", "db.rows_returned": 3 },
  },
  {
    id: "payment",
    parentId: "root",
    name: "stripe.charge",
    start: 115,
    duration: 140,
    service: "payment-svc",
    status: "error",
    attributes: {
      "error.type": "card_declined",
      "stripe.request_id": "req_8Fq2LxN0",
      "retry.count": 0,
    },
  },
  {
    id: "mail",
    parentId: "root",
    name: "email.sendConfirmation",
    start: 260,
    duration: 45,
    service: "mailer",
  },
]

function TraceInspectorDemo() {
  const [span, setSpan] = React.useState<Span | null>(
    TRACE_SPANS.find(({ id }) => id === "payment") ?? null
  )

  return (
    <Screen
      title="Trace 4bf92f35"
      description="Checkout request from cus_93kd, 2 minutes ago."
      actions={<Badge variant="destructive">402</Badge>}
    >
      <div className="grid gap-6 @4xl:grid-cols-[1fr_20rem]">
        <TraceWaterfall
          spans={TRACE_SPANS}
          selectedSpanId={span?.id ?? null}
          onSpanSelect={setSpan}
          defaultExpandedSpanIds={["root", "inventory"]}
          showSpanDetails={false}
        />
        <div className="flex flex-col gap-2">
          <h4 className="truncate font-mono text-sm">
            {span ? span.name : "Select a span"}
          </h4>
          <JsonViewer
            aria-label="Span attributes"
            data={
              span
                ? {
                    service: span.service,
                    status: span.status ?? "ok",
                    start_ms: span.start,
                    duration_ms: span.duration,
                    attributes: span.attributes ?? {},
                  }
                : {}
            }
            defaultExpandDepth={2}
            className="h-80"
          />
        </div>
      </div>
    </Screen>
  )
}

const API_SCOPES = [
  { value: "read:projects", label: "read:projects", group: "Projects" },
  { value: "write:projects", label: "write:projects", group: "Projects" },
  { value: "read:deploys", label: "read:deploys", group: "Deploys" },
  { value: "write:deploys", label: "write:deploys", group: "Deploys" },
  { value: "read:billing", label: "read:billing", group: "Billing" },
]

const API_KEYS = [
  {
    name: "Deploy bot",
    created: "Oct 12 by Riya Kapoor",
    secret: "sk_live_51Mz8Qk2xPa1b2",
    scopes: ["read:projects", "write:deploys"],
  },
  {
    name: "Analytics export",
    created: "Sep 3 by Noor Haddad",
    secret: "sk_live_93Lq0Vn7Wc4d8",
    scopes: ["read:billing"],
  },
]

function ApiKeysDemo() {
  return (
    <Screen
      title="API keys"
      description="Keys act as the workspace. Give each one only the scopes it needs."
      actions={<Button>Create key</Button>}
    >
      <ul className="flex flex-col gap-4">
        {API_KEYS.map((key) => (
          <li
            key={key.name}
            className="grid gap-4 rounded-lg border p-4 @3xl:grid-cols-[12rem_1fr_1fr_auto] @3xl:items-end"
          >
            <div>
              <p className="font-medium">{key.name}</p>
              <p className="text-xs text-muted-foreground">
                Created {key.created}
              </p>
            </div>
            <Field label="Secret key">
              <SecretField
                aria-label={`${key.name} secret key`}
                value={key.secret}
              />
            </Field>
            <Field label="Scopes">
              <MultiSelect
                aria-label={`${key.name} scopes`}
                options={API_SCOPES}
                defaultValue={key.scopes}
                placeholder="Add scope"
              />
            </Field>
            <Button variant="outline">Revoke</Button>
          </li>
        ))}
      </ul>
    </Screen>
  )
}

const PROJECT_TREE: TreeNode[] = [
  {
    id: "brand",
    label: "Brand",
    icon: <FolderIcon />,
    children: [
      { id: "brand/logos", label: "Logos", icon: <FolderIcon />, children: [] },
      {
        id: "brand/guidelines",
        label: "guidelines.pdf",
        icon: <FileIcon />,
      },
    ],
  },
  {
    id: "launch",
    label: "Q4 launch",
    icon: <FolderIcon />,
    children: [
      { id: "launch/deck", label: "deck.key", icon: <FileIcon /> },
      { id: "launch/press", label: "press-kit.zip", icon: <FileIcon /> },
    ],
  },
  { id: "archive", label: "Archive", icon: <ArchiveIcon />, children: [] },
]

const MAX_FILE_BYTES = 20 * 1024 * 1024

function FileManagerDemo() {
  const [files, setFiles] = React.useState([
    { name: "hero-banner.png", size: 2_516_582, progress: 64 },
    { name: "launch-notes.pdf", size: 418_201, progress: 100 },
  ])

  function addFiles(accepted: File[]) {
    setFiles((current) => [
      ...accepted.map((file) => ({
        name: file.name,
        size: file.size,
        progress: 100,
      })),
      ...current,
    ])
  }

  return (
    <Screen
      title="Files"
      description="Drop files into the open folder. PNG and PDF up to 20 MB."
    >
      <div className="grid gap-6 @3xl:grid-cols-[16rem_1fr]">
        <TreeView
          aria-label="Folders"
          items={PROJECT_TREE}
          defaultExpanded={["brand", "launch"]}
          defaultSelected="launch"
          className="rounded-lg border p-2 text-sm"
        />
        <div className="flex flex-col gap-3">
          <FileDropzone
            accept=".pdf,image/png"
            maxSize={MAX_FILE_BYTES}
            onFilesAccepted={addFiles}
          />
          <FileDropzoneList>
            {files.map((file) => (
              <FileDropzoneItem
                key={file.name}
                name={file.name}
                size={file.size}
                progress={file.progress}
                onRemove={() =>
                  setFiles((current) =>
                    current.filter(({ name }) => name !== file.name)
                  )
                }
              />
            ))}
          </FileDropzoneList>
        </div>
      </div>
    </Screen>
  )
}

const CONFIG_BEFORE = `service: billing
replicas: 2
timeout: 30s
region: eu-west-1
log_level: info`

const CONFIG_AFTER = `service: billing
replicas: 4
timeout: 30s
region: eu-central-1
log_level: info
tracing: true`

const DIFF_MODES: DiffMode[] = ["split", "unified"]

const REVIEWER = { id: "you", name: "Riya Kapoor" }

const REVIEW_PEOPLE = [
  { value: "noor", label: "Noor Haddad", description: "Platform" },
  { value: "tomasz", label: "Tomasz Wierzba", description: "Payments" },
]

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000)
}

function reviewComments(): Comment[] {
  return [
    {
      id: "1",
      author: { id: "noor", name: "Noor Haddad" },
      body: "Does eu-central-1 have the read replica yet? cc @tomasz",
      createdAt: minutesAgo(120),
      reactions: [{ emoji: "👀", userIds: ["tomasz"] }],
    },
    {
      id: "2",
      parentId: "1",
      author: { id: "tomasz", name: "Tomasz Wierzba" },
      body: "Since Friday. Doubling replicas covers the move.",
      createdAt: minutesAgo(30),
    },
  ]
}

function CodeReviewDemo() {
  const [mode, setMode] = React.useState<DiffMode>("split")
  const [comments] = React.useState(reviewComments)

  return (
    <Screen
      title="Move billing to eu-central-1"
      description="deploy/billing.yaml · 3 lines changed"
      actions={
        <div className="flex gap-1">
          {DIFF_MODES.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={mode === option ? "secondary" : "ghost"}
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className="capitalize"
            >
              {option}
            </Button>
          ))}
        </div>
      }
    >
      <DiffViewer
        aria-label="Changes to billing.yaml"
        oldValue={CONFIG_BEFORE}
        newValue={CONFIG_AFTER}
        mode={mode}
      />
      <CommentThread
        aria-label="Review thread on billing.yaml"
        defaultComments={comments}
        currentUser={REVIEWER}
        mentionSuggestions={REVIEW_PEOPLE}
      />
    </Screen>
  )
}

const ROLES: PermissionRole[] = [
  { id: "viewer", name: "Viewer", description: "Read-only access" },
  {
    id: "editor",
    name: "Editor",
    description: "Edit content",
    inheritsFrom: "viewer",
  },
  {
    id: "manager",
    name: "Manager",
    description: "Runs a team",
    inheritsFrom: "editor",
  },
  {
    id: "admin",
    name: "Admin",
    description: "Full control",
    inheritsFrom: "manager",
  },
]

const PERMISSIONS: PermissionGroup[] = [
  {
    id: "projects",
    name: "Projects",
    permissions: [
      { id: "projects.view", name: "View projects" },
      { id: "projects.edit", name: "Edit projects" },
      { id: "projects.delete", name: "Delete projects" },
    ],
  },
  {
    id: "team",
    name: "Team",
    permissions: [
      { id: "team.invite", name: "Invite members" },
      { id: "team.manage", name: "Change roles" },
    ],
  },
  {
    id: "billing",
    name: "Billing",
    permissions: [
      { id: "billing.view", name: "View invoices" },
      { id: "billing.edit", name: "Change plan" },
    ],
  },
]

const GRANTS = {
  viewer: ["projects.view"],
  editor: ["projects.edit"],
  manager: ["team.invite", "billing.view"],
  admin: ["projects.delete", "team.manage", "billing.edit"],
}

const ADMINS = ["Ana Lima", "Kenji Sato", "Priya Nair", "Lea Becker"]

function RolesDemo() {
  return (
    <Screen
      title="Roles and permissions"
      description="Each role inherits everything from the one to its left."
      actions={
        <AvatarGroup aria-label="Admins" max={3}>
          {ADMINS.map((name) => (
            <AvatarGroupItem key={name} name={name} />
          ))}
        </AvatarGroup>
      }
    >
      <PermissionMatrix
        roles={ROLES}
        permissions={PERMISSIONS}
        defaultValue={GRANTS}
        defaultExpandedGroups={["projects", "team"]}
      />
    </Screen>
  )
}

const AUDIT_EVENTS = [
  {
    actor: "noor",
    action: "deploy",
    title: "Deployed billing v2.14.0 to production",
    time: "Noor Haddad, 14:32",
  },
  {
    actor: "tomasz",
    action: "approve",
    title: "Approved the billing release",
    time: "Tomasz Wierzba, 13:58",
  },
  {
    actor: "riya",
    action: "invite",
    title: "Invited ilse@ledgerline.dev as Member",
    time: "Riya Kapoor, 12:10",
  },
  {
    actor: "noor",
    action: "deploy",
    title: "Deployed web v8.3.1 to staging",
    time: "Noor Haddad, 11:47",
  },
  {
    actor: "riya",
    action: "rotate-key",
    title: "Rotated the Deploy bot API key",
    time: "Riya Kapoor, 09:05",
  },
]

function matchesFilters(
  event: (typeof AUDIT_EVENTS)[number],
  filters: string[]
) {
  return filters.every((filter) => {
    const [field, value] = filter.split(":")
    if (field === "actor") return event.actor === value
    if (field === "action") return event.action === value

    return event.title.toLowerCase().includes(filter.toLowerCase())
  })
}

function AuditLogDemo() {
  const [filters, setFilters] = React.useState(["actor:noor"])
  const events = AUDIT_EVENTS.filter((event) => matchesFilters(event, filters))

  return (
    <Screen
      title="Audit log"
      description="Every change in the workspace, newest first."
    >
      <Field
        label="Filters"
        hint="Try actor:riya, action:deploy, or any word. Remove a filter with Backspace."
      >
        <TagsInput
          value={filters}
          onValueChange={setFilters}
          placeholder="Add filter"
        />
      </Field>
      {events.length > 0 ? (
        <Timeline>
          {events.map((event, index) => (
            <TimelineItem key={event.title} className="pb-5">
              <TimelineIndicator
                variant={index === 0 ? "current" : "default"}
              />
              <TimelineContent className="gap-0.5">
                <TimelineTitle className="text-sm">{event.title}</TimelineTitle>
                <TimelineTime className="text-xs">{event.time}</TimelineTime>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No events match these filters.
        </p>
      )}
    </Screen>
  )
}

const DEMOS: Record<BlockKind, React.ComponentType> = {
  onboarding: OnboardingDemo,
  "team-invite": TeamInviteDemo,
  profile: ProfileDemo,
  security: SecurityDemo,
  release: ReleaseDemo,
  "service-status": ServiceStatusDemo,
  "trace-inspector": TraceInspectorDemo,
  "api-keys": ApiKeysDemo,
  "file-manager": FileManagerDemo,
  "code-review": CodeReviewDemo,
  roles: RolesDemo,
  "audit-log": AuditLogDemo,
}

export const BLOCK_DEMO_WIDTHS: Partial<Record<BlockKind, string>> = {
  onboarding: "40rem",
  "team-invite": "42rem",
  profile: "56rem",
  security: "56rem",
  release: "52rem",
  "audit-log": "42rem",
}

export function BlockDemo({ kind }: { kind: BlockKind }) {
  const Demo = DEMOS[kind]

  return <Demo />
}
