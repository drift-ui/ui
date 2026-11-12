type ComponentUsage = {
  notes: string
  example?: string
  baseExample?: string
}

const SAME_AS_SHADCN =
  "Identical API to the shadcn/ui component of the same name. Skip it if the project already has one."

export const COMPONENT_USAGE: Record<string, ComponentUsage> = {
  "activity-heatmap": {
    notes:
      "ActivityHeatmap displays activity and contributions over a year on a grid of weeks by weekdays. Intensity levels 0 to 4 are mapped from counts using theme tokens (bg-muted/40 through bg-primary). Follows the WAI-ARIA grid pattern with a single tab stop and 2D arrow key navigation across cells. Includes accessible labels, customizable week start day, optional summary header, floating tooltips on hover and focus (with custom renderTooltip support), and a legend.",
    example: `import { ActivityHeatmap } from "@/components/ui/activity-heatmap"

const DATA = [
  { date: "2026-10-30", count: 3 },
  { date: "2026-10-31", count: 7 },
]

export function ContributionGraph() {
  return (
    <ActivityHeatmap
      data={DATA}
      weekStartsOn={1}
      onDaySelect={(day) => console.log(day.date, day.count)}
    />
  )
}`,
  },
  avatar: {
    notes: SAME_AS_SHADCN,
    example: `import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserAvatar() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}`,
  },
  "avatar-group": {
    notes:
      "AvatarGroup stacks AvatarGroupItem children with overlap. max shows that many avatars and turns the rest into a +N button that opens a popover listing them by name. AvatarGroupItem takes name (required, used for initials, the title tooltip and the screen reader label), src and status (online, away, busy or offline) for a presence dot. Built on the shadcn avatar and popover primitives. Pass aria-label to the group.",
    example: `import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"

export function Assignees({ users }: { users: { id: string; name: string; image?: string }[] }) {
  return (
    <AvatarGroup aria-label="Assignees" max={4}>
      {users.map((user) => (
        <AvatarGroupItem key={user.id} name={user.name} src={user.image} status="online" />
      ))}
    </AvatarGroup>
  )
}`,
  },
  badge: {
    notes: SAME_AS_SHADCN,
    example: `import { Badge } from "@/components/ui/badge"

export function StatusBadge() {
  return <Badge variant="secondary">Active</Badge>
}`,
  },
  "bulk-action-bar": {
    notes:
      "Floating toolbar (Radix or Base UI) that animates in when selectedCount > 0. Props: selectedCount, onClear (also bound to Escape), placement: 'viewport' (portaled, default) or 'container' (absolute inside a relative parent). Put BulkActionBarButton children inside. Requires the motion package.",
    example: `import { BulkActionBar, BulkActionBarButton } from "@/components/ui/bulk-action-bar"

export function FileActions({ selected, onClear }: { selected: string[]; onClear: () => void }) {
  return (
    <BulkActionBar selectedCount={selected.length} onClear={onClear}>
      <BulkActionBarButton>Move</BulkActionBarButton>
      <BulkActionBarButton variant="destructive">Delete</BulkActionBarButton>
    </BulkActionBar>
  )
}`,
  },
  button: {
    notes: SAME_AS_SHADCN,
    example: `import { Button } from "@/components/ui/button"

export function SaveButton() {
  return <Button variant="outline">Save changes</Button>
}`,
  },
  card: {
    notes: SAME_AS_SHADCN,
    example: `import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"

export function PlanCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pro plan</CardTitle>
        <CardDescription>For growing teams.</CardDescription>
      </CardHeader>
      <CardContent>$20 a month per seat.</CardContent>
      <CardFooter>Cancel any time.</CardFooter>
    </Card>
  )
}`,
  },
  "color-picker": {
    notes:
      "Popover picker with a saturation and brightness area, hue and alpha sliders, hex input, oklch readout and the native EyeDropper where supported. Value is a hex string (#rrggbb or #rrggbbaa). Props: value/defaultValue/onValueChange, showAlpha, swatches.",
    example: `import { ColorPicker } from "@/components/ui/color-picker"

export function BrandColorField() {
  return <ColorPicker aria-label="Brand color" defaultValue="#6366f1" swatches={["#0f172a", "#6366f1", "#10b981"]} />
}`,
  },
  "comment-thread": {
    notes:
      "One review thread: top-level comments with one level of replies, @mentions through mention-textarea, edit and delete on the current user's own comments, reactions and resolve. comments: Comment[] with { id, parentId?, author: { id, name, avatarUrl? }, body, createdAt, editedAt?, deleted?, reactions?: { emoji, userIds }[] }. A reply to a reply is shown under the same top-level comment, and a reply whose parent is missing is shown as a top-level comment. Top-level comments render in array order, and each one's replies follow it in array order. Bodies are plain text; @value is highlighted when value is in mentionSuggestions. State: comments/defaultComments/onCommentsChange and resolved/defaultResolved/onResolvedChange. Persistence: onReply(parentId, body, mentions), onEdit(id, body, mentions) and onDelete(id) may return a promise; the thread applies the change only after it resolves and keeps the draft if it rejects. onReactionToggle(id, emoji) fires after the change is applied. Use either onCommentsChange or the event callbacks to update your own list, not both. Leave out currentUser for a read-only thread. Ctrl/Cmd+Enter submits, Escape cancels an edit or reply.",
    example: `"use client"

import { CommentThread } from "@/components/ui/comment-thread"

const me = { id: "riya", name: "Riya Kapoor" }
const people = [{ value: "noor", label: "Noor Haddad" }, { value: "riya", label: "Riya Kapoor" }]

export function ReviewThread() {
  return (
    <CommentThread
      currentUser={me}
      mentionSuggestions={people}
      defaultComments={[
        { id: "1", author: { id: "noor", name: "Noor Haddad" }, body: "Retry on 429 too? cc @riya", createdAt: "2026-11-04T09:00:00Z" },
      ]}
      onReply={async (parentId, body, mentions) => {
        const response = await fetch("/api/comments", { method: "POST", body: JSON.stringify({ parentId, body, mentions }) })
        if (!response.ok) throw new Error("Could not save the comment")
      }}
    />
  )
}`,
  },
  "csv-importer": {
    notes:
      "Multi-step CSV import workflow component. Composes file-dropzone for upload, stepper for the 4-step wizard, and virtual-list for reviewing and fixing invalid rows. Parses CSV in the browser with support for quotes, newlines, escaped quotes, CRLF, and UTF-8 BOM. Auto-suggests column mappings case-insensitively, and validates rows inline with custom rules. Props: fields: CsvField[], onComplete: (rows: Record<string, any>[]) => void, onCancel?, maxRows? (default 10000), maxFileSize? (default 10MB), sampleRowsCount? (default 3), autoMap? (default true), step/defaultStep/onStepChange, defaultFile?.",
    example: `"use client"

import { CsvImporter } from "@/components/ui/csv-importer"

export function CustomerImport() {
  return (
    <CsvImporter
      fields={[
        { id: "name", label: "Full Name", required: true },
        {
          id: "email",
          label: "Email",
          required: true,
          validate: (val) => (val.includes("@") ? true : "Invalid email address"),
        },
        { id: "role", label: "Role" },
      ]}
      onComplete={(rows) => {
        console.log("Imported clean rows:", rows)
      }}
    />
  )
}`,
  },
  "date-time-range": {
    notes:
      'DateTimeRangePicker with value/defaultValue of { from?: Date, to?: Date } and onValueChange. Start and end times default to 09:00 and 17:00 and are edited with two TimeFields in the popover. locale formats the trigger and picks a 12 or 24 hour clock. presets takes { label, value } items; build them once (useState or useMemo) so the pressed preset still matches after a re-render. min and max disable days outside the bounds and clamp times on the edge days. Editing a day or time never puts the end before the start, and a preset with its end before its start is disabled. A "Type a range" field at the top of the popover reads English text: "last 7 days", "past 2 hours", "next 3 days", today, yesterday, tomorrow, weekdays such as "next fri 3pm", "3 days ago", and "A to B" ranges such as "yesterday to now" or "mon 9am to fri 5pm". It previews the parsed range as you type and applies it on Enter. A range that overlaps min or max is clamped to them; text it can\'t read, a range entirely outside min and max, or one ending before it starts leaves the range unchanged and shows a message. A day alone covers the whole day, a moment alone sets only the start. "next fri" is the first Friday after today, "last fri" the first before, and a bare "fri" is today or the coming one. Pass parse(text, now) returning { from, to } or null to support other phrasings or languages, for example with chrono-node. The local time zone is shown next to each time; the picker does not convert zones. Other props go to the trigger button, so pass id for a Label. Installs the shadcn calendar, input and popover and drift\'s time-field.',
    example: `"use client"

import { useState } from "react"
import { DateTimeRangePicker, type DateTimeRangePreset } from "@/components/ui/date-time-range"

function lastDays(days: number): DateTimeRangePreset {
  const now = new Date()
  return {
    label: \`Last \${days} days\`,
    value: {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59),
    },
  }
}

export function ReportPeriodField() {
  const [presets] = useState(() => [lastDays(7), lastDays(30)])
  return <DateTimeRangePicker id="report-period" presets={presets} />
}`,
  },
  "description-list": {
    notes:
      'DescriptionList renders a <dl> grid and DescriptionItem renders one label and value row. copyable adds a copy button for the value. editable turns string children into an InlineEdit that calls onValueChange(value), which may return a promise; the parent re-renders with the new text, so keep the value in state. Pass a string label so buttons get names like "Copy ID".',
    example: `"use client"

import { useState } from "react"
import { DescriptionItem, DescriptionList } from "@/components/ui/description-list"

export function UserDetails() {
  const [owner, setOwner] = useState("Ana Lima")
  return (
    <DescriptionList>
      <DescriptionItem label="ID" copyable>usr_8f2a</DescriptionItem>
      <DescriptionItem label="Owner" editable onValueChange={setOwner}>{owner}</DescriptionItem>
    </DescriptionList>
  )
}`,
  },
  dialog: {
    notes: SAME_AS_SHADCN,
    example: `import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

export function ProfileDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Changes apply immediately.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}`,
    baseExample: `import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

export function ProfileDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Changes apply immediately.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}`,
  },
  "diff-viewer": {
    notes:
      "Compares two strings line by line with no dependencies. mode is split (default) or unified, and the component holds no mode state, so a mode switch belongs to the parent. Replaced lines that share a word get word-level highlights in ins and del elements. Runs of unchanged lines beyond contextLines (default 3) collapse behind a Show N unchanged lines button that stays in place as Hide once open, so keyboard focus stays on it. Added lines use the chart-2 token and removed lines use destructive; every changed line also has a + or - sign and screen reader text, so color is not the only signal. ignoreWhitespace treats lines that differ only in whitespace as unchanged (git diff -w); word highlights skip whitespace, and in split mode each side keeps its own text. renderLine(line) replaces the line text, for syntax highlighting with Shiki or Prism brought by the app, and line.segments still holds the word changes. renderGutter(line) adds a cell per line, per side in split mode, for actions such as a comment button. Rows never wrap: long lines scroll sideways, so every row has a fixed 20px height, and renderLine and renderGutter output is clipped to it (keep gutter buttons at size-5 or smaller). Wide characters such as CJK count as two columns when sizing the table. A row that holds focus stays rendered while scrolled out of view. Past 300 rows only the rows near the viewport render, the root gets max-h-[32rem] (override with className), and the table sets aria-rowcount and aria-rowindex. Collapsed-region buttons always render so Tab reaches all of them. The diff is an exact shortest edit script with no size limit: two 10,000-line files with 1,000 changed lines diff in about 50 ms and a full rewrite in about 150 ms on a laptop. Pass aria-label to name the table.",
    example: `import { DiffViewer } from "@/components/ui/diff-viewer"

export function RevisionDiff({ before, after }: { before: string; after: string }) {
  return (
    <DiffViewer
      aria-label="Changes to billing.yaml"
      oldValue={before}
      newValue={after}
      mode="unified"
      contextLines={2}
    />
  )
}`,
  },
  "duration-input": {
    notes:
      "Segmented editor for durations and time intervals stored as milliseconds. value and onValueChange take number | null. units (default ['h', 'm', 's']) configures visible segments from ['w', 'd', 'h', 'm', 's', 'ms']. Accepts typed shorthand (entering 90 in minutes or 90m normalizes to 1h 30m), unit jump keys (h, m, s, d), and pasting duration strings or ISO 8601 durations (PT1H30M). Segments auto-advance after two digits, so values of 100 or more need the unit key (120h). A pasted bare number uses the focused segment's unit, and pasted values round to the smallest visible unit. Arrow keys step values, Home/End set segment boundaries, and Backspace clears.",
    example: `import { DurationInput } from "@/components/ui/duration-input"

export function TimeoutField({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <DurationInput
      aria-label="Execution timeout"
      value={value}
      onValueChange={onChange}
      units={["h", "m", "s"]}
      max={86_400_000}
    />
  )
}`,
  },
  "emoji-picker": {
    notes:
      "An inline panel: it has no trigger, so wrap it in a Popover for a reaction button, and override the border with className if the panel doubles it. onSelect(emoji) receives the emoji string, with the skin tone applied. Emoji data comes from emojibase-data through a dynamic import on first mount (about 100 KB gzipped) and is cached for later mounts. Emoji newer than Emoji 15 are left out so older systems do not show empty boxes. Recent emoji and the skin tone persist in localStorage under drift-ui:emoji-picker; recents appear on the next mount, so the grid never shifts under the pointer. skinTone (0 to 5, 0 is the default yellow) with onSkinToneChange makes the tone controlled, and defaultSkinTone sets it until the user picks one. Keyboard: ArrowDown leaves the search field for the grid, arrow keys move between emoji, ArrowUp from the top row returns to search, Home and End go to the row ends, Ctrl or Cmd with Home or End go to the grid ends, PageUp and PageDown jump between categories, Enter or Space selects, and Enter in the search field selects the first result. Category icons are pointer shortcuts, hidden from the keyboard and screen readers because PageUp and PageDown do the same job.",
    example: `import { EmojiPicker } from "@/components/ui/emoji-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function ReactionButton({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger>Add reaction</PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <EmojiPicker aria-label="Add a reaction" onSelect={onReact} className="border-0" />
      </PopoverContent>
    </Popover>
  )
}`,
  },
  "file-dropzone": {
    notes:
      "FileDropzone validates accept (extensions, MIME types, image/*), maxSize in bytes and maxFiles, then calls onFilesAccepted(files) and onFilesRejected(rejections) where each rejection has { file, reason: 'type' | 'size' | 'count' }. It does not upload or store files: keep the list in your own state and render FileDropzoneList > FileDropzoneItem(name, size, progress?, error?, onRemove?). formatBytes is exported.",
    example: `"use client"

import { useState } from "react"
import { FileDropzone, FileDropzoneItem, FileDropzoneList } from "@/components/ui/file-dropzone"

export function AttachmentsField() {
  const [files, setFiles] = useState<File[]>([])

  return (
    <div className="grid gap-3">
      <FileDropzone accept=".pdf,image/*" maxSize={10 * 1024 * 1024} onFilesAccepted={(added) => setFiles((current) => [...current, ...added])} />
      <FileDropzoneList>
        {files.map((file) => (
          <FileDropzoneItem key={file.name} name={file.name} size={file.size} onRemove={() => setFiles((current) => current.filter((item) => item !== file))} />
        ))}
      </FileDropzoneList>
    </div>
  )
}`,
  },
  "filter-builder": {
    notes:
      "Chip based filters with nested AND/OR groups, date fields, multi-select, and URL serialization. fields: FilterField[] with { id, label, type: 'text' | 'number' | 'select' | 'date', options? }. Value is Filter[] or FilterGroup. Use matchesFilters(row, filters) from @/lib/filter. Scale limit: up to 2 nested levels and 20 filters recommended in UI.",
    example: `"use client"

import { useState } from "react"
import { FilterBuilder } from "@/components/ui/filter-builder"
import { matchesFilters, type Filter, type FilterField, type FilterGroup } from "@/lib/filter"

const fields: FilterField[] = [
  { id: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }] },
  { id: "title", label: "Title", type: "text" },
  { id: "due", label: "Due date", type: "date" },
]

export function IssueFilters({ issues }: { issues: { status: string; title: string; due?: string }[] }) {
  const [filters, setFilters] = useState<Filter[] | FilterGroup>([])
  const visible = issues.filter((issue) => matchesFilters(issue, filters))

  return (
    <div className="grid gap-3">
      <FilterBuilder fields={fields} value={filters} onValueChange={setFilters} />
      <p className="text-sm text-muted-foreground">{visible.length} issues</p>
    </div>
  )
}`,
  },
  "image-cropper": {
    notes:
      "Interactive image crop component for avatars and covers. Supports pointer drag-to-pan, 2-finger pinch zoom, mouse wheel / slider zoom, 90-degree step rotation, rule-of-thirds grid, and fixed aspect ratios (1 for square, 16/9 for banner, 4/3 for photo). cropShape can be 'rect' or 'round'. Emits a cropped Blob and pixel crop coordinates through onCropComplete(blob, pixelCrop) when user clicks Apply or presses Enter. Shows a pulsing stage while the image loads and a message if it fails, keeps Apply disabled until it has loaded, and reports load or canvas errors via onCropError(error). The Reset button restores defaultZoom, defaultRotation and defaultCrop. Wheel and trackpad pinch zoom scale with the scroll delta, and the wheel falls through to page scroll at the zoom limits. Full keyboard support with Arrow keys to pan (Shift for 10x larger steps), + / - or [ / ] to zoom, R to rotate, and Enter to apply crop.",
    example: `"use client"

import { useState } from "react"
import { ImageCropper } from "@/components/ui/image-cropper"

export function AvatarUpload() {
  const [blob, setBlob] = useState<Blob | null>(null)

  return (
    <ImageCropper
      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200"
      aspect={1}
      cropShape="round"
      onCropComplete={(croppedBlob) => setBlob(croppedBlob)}
    />
  )
}`,
  },
  "inline-edit": {
    notes:
      "Click to edit, Enter or blur saves, Escape cancels. value is required and onSave(value) may return a promise; while it is pending the field is read only, and a rejected promise marks it invalid and keeps it open. Pass aria-label describing the field.",
    example: `"use client"

import { useState } from "react"
import { InlineEdit } from "@/components/ui/inline-edit"

export function ProjectName() {
  const [name, setName] = useState("Billing migration")
  return <InlineEdit aria-label="Project name" value={name} onSave={setName} />
}`,
  },
  input: {
    notes: SAME_AS_SHADCN,
    example: `import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EmailField() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@company.com" />
    </div>
  )
}`,
  },
  "json-viewer": {
    notes:
      "Read-only JSON tree built on tree-view, so arrow keys, Home, End and typeahead work. Pass virtual for large payloads to limit rendered DOM nodes. Search uses deferred value updates to keep the search input responsive. Filter paths using dot notation or wildcards (e.g. users[*].email or *.id) via the pathFilter prop or the toolbar path filter toggle. Long strings exceeding maxStringLength (default 80) or containing newlines truncate with inline Show more and Show less toggles, while copying (hover button or Ctrl/Cmd+C) always copies the full untruncated string. defaultExpandDepth (default 1) controls initial expansion. Strings, numbers and booleans use chart-2, chart-1 and chart-3 tokens mixed with foreground for readable contrast, and null uses muted text. Arrays over 100 items split into groups of 100.",
    example: `import { JsonViewer } from "@/components/ui/json-viewer"

export function WebhookPayload({ payload }: { payload: unknown }) {
  return (
    <JsonViewer
      virtual
      aria-label="Webhook payload"
      data={payload}
      defaultExpandDepth={2}
      className="h-80 w-full"
    />
  )
}`,
  },
  "key-value-editor": {
    notes:
      "Rows of key and value for env vars, HTTP headers, query params or metadata. Each row is { id, key, value }; value/defaultValue/onValueChange hold the array. Enter in the last row adds a row and focuses its key, Enter elsewhere moves to the next row's key. Pasting text that contains KEY=value into a key field splits it into rows: comments, blank lines, an export prefix, quoted values and = inside a value are handled, multi-line values are not. Keys used more than once (after trimming) are marked aria-invalid with a Duplicate key message. secretValues masks every value with password-input, each with its own reveal button. Inputs are labelled Key 1, Value 1 and Remove row 1; rename with keyLabel and valueLabel. Pass aria-label to name the group.",
    example: `import { KeyValueEditor, type KeyValueRow } from "@/components/ui/key-value-editor"

export function EnvVars({
  rows,
  onRowsChange,
}: {
  rows: KeyValueRow[]
  onRowsChange: (rows: KeyValueRow[]) => void
}) {
  return (
    <KeyValueEditor
      aria-label="Environment variables"
      value={rows}
      onValueChange={onRowsChange}
      secretValues
    />
  )
}`,
  },
  label: {
    notes: SAME_AS_SHADCN,
    example: `import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function NameField() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="name">Display name</Label>
      <Input id="name" />
    </div>
  )
}`,
  },
  "log-viewer": {
    notes:
      "High-throughput virtualized log viewer with ANSI color parsing, search, level filtering, and tail auto-scroll. lines is an array of LogLine ({ id, message, timestamp?, level?, lineNumber? }). parseAnsi converts ANSI escape sequences into styled text spans safely without dangerouslySetInnerHTML. Follow mode auto-scrolls to new lines when at the bottom; scrolling up automatically pauses follow, and clicking the floating Jump to latest button resumes it. Search filters across stripped log messages, levels, and formatted timestamps. Level filter buttons isolate lines by log severity (e.g. error, warn, info, debug) while preserving original line numbers in the gutter. Long messages scroll sideways in one shared viewport with the line numbers pinned; the Wrap toggle (wrap/defaultWrap/onWrapChange) wraps them onto extra lines instead. VirtualList ensures smooth 60fps rendering even with tens of thousands of lines.",
    example: `"use client"

import { LogViewer, type LogLine } from "@/components/ui/log-viewer"

const LOG_LINES: LogLine[] = [
  { id: "1", timestamp: Date.now() - 3000, level: "info", message: "Build started..." },
  { id: "2", timestamp: Date.now() - 2000, level: "info", message: "\\u001b[32mCompiled successfully\\u001b[0m in 1.2s" },
  { id: "3", timestamp: Date.now() - 1000, level: "warn", message: "\\u001b[33mWarning: asset size exceeds recommended budget\\u001b[0m" },
]

export function BuildLogs() {
  return (
    <LogViewer
      lines={LOG_LINES}
      height={360}
      showLineNumbers
      showTimestamps
    />
  )
}`,
  },
  "masked-input": {
    notes:
      "MaskedInput and CurrencyInput format typed input while storing unmasked or numeric values. MaskedInput takes mask (tokens: # digit, a or A letter, * alphanumeric) and stores raw unmasked characters in value/onValueChange or defaultValue. Caret position does not jump when inserting or deleting characters over fixed mask delimiters. CurrencyInput accepts currency and locale to format currency with Intl.NumberFormat live while storing integer cents (number | null) in value/onValueChange. Supports min and max clamping (enforced on blur and capping max during input), and name submits the raw value or cents via a hidden input.",
    example: `import { CurrencyInput, MaskedInput } from "@/components/ui/masked-input"
import { Label } from "@/components/ui/label"

export function PaymentFields() {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="card">Card number</Label>
        <MaskedInput id="card" mask="#### #### #### ####" placeholder="4242 4242 4242 4242" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="price">Amount</Label>
        <CurrencyInput id="price" currency="USD" locale="en-US" defaultValue={4999} />
      </div>
    </div>
  )
}`,
  },
  "mention-textarea": {
    notes:
      "Textarea that opens a suggestion list when the caret follows a trigger character. triggers maps a character to a list of options, for example { '@': people, '#': channels }, each { value, label, description? }, or to a search function (query, { signal }) => Promise<MentionOption[]>. A search runs searchDelay ms (default 150) after typing stops; each new query aborts the previous request, so stale responses never show, and the list shows loading, no results and error states in a polite status region. Selecting inserts trigger + value + space. Inserted mentions are atomic: Backspace right after one or Delete right before one removes it whole, the caret jumps over it, and a selection grows to cover it. Mentions are recognised from the text, so a mention is any trigger + value from a static list or picked from a search in this session, at the start or after whitespace, and followed by whitespace, the end, or closing punctuation (\"(@noor)\" stays plain text). Enter and Tab are left to the IME while a Japanese, Chinese or Korean composition is active. Value is plain text with value/defaultValue/onValueChange. Each trigger key is one character. Finding mentions measured under 1 ms per change at 200,000 characters and 10,000 known mentions.",
    example: `import { MentionTextarea } from "@/components/ui/mention-textarea"

const people = [{ value: "noor", label: "Noor Haddad" }, { value: "tomasz", label: "Tomasz Wierzba" }]

async function searchChannels(query: string, { signal }: { signal: AbortSignal }) {
  const response = await fetch("/api/channels?q=" + encodeURIComponent(query), { signal })
  if (!response.ok) throw new Error(response.statusText)
  return response.json()
}

export function CommentBox() {
  return <MentionTextarea aria-label="Comment" placeholder="Write a comment" triggers={{ "@": people, "#": searchChannels }} />
}`,
  },
  "multi-select": {
    notes:
      "Pick several values from a known list. options: { value, label, group? }[]. Controlled with value/onValueChange or uncontrolled with defaultValue, both string[]. Typing filters, Enter toggles the highlighted option, Backspace on an empty field selects then removes the last chip, and a clear button empties the selection. Props: maxSelected (disables unselected options when reached and hides Select all), maxVisibleChips (collapses the rest into +N). Spreads remaining props onto the inner input, so id, placeholder and aria-label work. For free text use tags-input instead.",
    example: `import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"

const regions = [
  { value: "eu-west-1", label: "Ireland", group: "Europe" },
  { value: "us-east-1", label: "Virginia", group: "Americas" },
]

export function RegionsField() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="regions">Regions</Label>
      <MultiSelect id="regions" options={regions} placeholder="Pick regions" maxVisibleChips={3} />
    </div>
  )
}`,
  },
  "notification-inbox": {
    notes:
      "A bell button with an unread count that opens a popover of notifications grouped by day, newest first. items: InboxNotification[] with { id, title, body?, createdAt: Date | string, read?, href?, actor?: { name, avatarUrl? } }; extra fields are kept and passed to renderItem and actions. State: items/defaultItems/onItemsChange and open/defaultOpen/onOpenChange. Clicking an item marks it read, calls onItemClick and closes the popover; an item with href renders as a link. Each row has a Mark as read or Mark as unread button plus any actions ({ label, icon, onSelect }). onMarkRead(ids) and onMarkUnread(ids) fire for single items; Mark all as read fires onMarkAllRead() only, so a server can mark everything read, including items that are not loaded. With a controlled items array, update it in onItemsChange or in those callbacks, not both. renderItem replaces the row content and sits inside the row's button or link, so it must not contain interactive elements; NotificationItem renders the default content. Up and Down arrows, Home and End move between items. Other props go to the trigger button.",
    example: `"use client"

import * as React from "react"
import { ArchiveIcon } from "lucide-react"

import { NotificationInbox, type InboxNotification } from "@/components/ui/notification-inbox"

export function Inbox({ initial }: { initial: InboxNotification[] }) {
  const [items, setItems] = React.useState(initial)

  return (
    <NotificationInbox
      items={items}
      onItemsChange={setItems}
      onMarkRead={(ids) => fetch("/api/notifications/read", { method: "POST", body: JSON.stringify({ ids }) })}
      onMarkAllRead={() => fetch("/api/notifications/read-all", { method: "POST" })}
      actions={[
        {
          label: "Archive",
          icon: <ArchiveIcon className="size-3.5" />,
          onSelect: (n) => setItems((current) => current.filter((item) => item.id !== n.id)),
        },
      ]}
    />
  )
}`,
  },
  "number-input": {
    notes:
      "Value is number | null. Props: min, max, step, locale, formatOptions (Intl.NumberFormatOptions, e.g. currency), name (submits the raw number through a hidden input). Arrow keys step, Shift or PageUp/PageDown step by 10x, Home/End jump to min/max. Typed text is parsed with the locale's separators.",
    example: `import { NumberInput } from "@/components/ui/number-input"

export function BudgetField() {
  return (
    <NumberInput
      aria-label="Monthly budget"
      defaultValue={1240.5}
      min={0}
      step={10}
      locale="de-DE"
      formatOptions={{ style: "currency", currency: "EUR" }}
    />
  )
}`,
  },
  "onboarding-checklist": {
    notes:
      "A setup guide on account dashboards with a task list, accessible native checkbox controls, action buttons, and a semantic progress bar ('2 of 5 done'). Supports controlled completion via completed and onCompletedChange, and uncontrolled completion initialized with defaultCompleted. Individual item toggle notifications use onItemToggle(item, completed). Collapsible mode supports controlled open/onOpenChange and uncontrolled initialization via defaultOpen. Items take id, title, optional description, and an optional action with label and either onClick or href (rendering a styled button or anchor without asChild).",
    example: `"use client"

import { useState } from "react"
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist"

const items = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your name, role, and timezone.",
    action: { label: "Edit profile", onClick: () => {} },
  },
  {
    id: "invite",
    title: "Invite your team",
    description: "Collaborate with colleagues on shared projects.",
    action: { label: "Invite", onClick: () => {} },
  },
]

export function DashboardChecklist() {
  const [completed, setCompleted] = useState(["profile"])

  return (
    <OnboardingChecklist
      title="Getting started"
      description="Finish setting up your workspace."
      items={items}
      completed={completed}
      onCompletedChange={setCompleted}
      collapsible
    />
  )
}`,
  },
  "password-input": {
    notes:
      "PasswordInput accepts every input prop except type and adds an accessible reveal toggle. PasswordStrength takes value and renders a 4 segment meter with a polite live region; override scoring with getScore(value) => 0 | 1 | 2 | 3 | 4 and labels with a 5 item tuple.",
    example: `"use client"

import { useState } from "react"
import { PasswordInput, PasswordStrength } from "@/components/ui/password-input"

export function NewPasswordField() {
  const [password, setPassword] = useState("")

  return (
    <div className="grid gap-2">
      <PasswordInput autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <PasswordStrength value={password} />
    </div>
  )
}`,
  },
  "permission-matrix": {
    notes:
      "PermissionMatrix maps roles against action permission groups for role-based access control (RBAC). It supports controlled and uncontrolled grants via value/defaultValue and onValueChange (Record<string, string[]> mapping roleId to permissionId[]). Roles support recursive inheritance with inheritsFrom; inherited permissions are highlighted with distinct styling and tooltips. Each group header row features a tri-state checkbox per role reflecting whether all, some, or none of its actions are granted. Sticky headers keep role columns and permission row headers visible during scroll. Fully navigable as a WAI-ARIA grid using Arrow keys, Home, End, PageUp, and PageDown.",
    example: `"use client"

import * as React from "react"
import { PermissionMatrix } from "@/components/ui/permission-matrix"

const ROLES = [
  { id: "viewer", name: "Viewer" },
  { id: "editor", name: "Editor", inheritsFrom: "viewer" },
  { id: "admin", name: "Admin", inheritsFrom: "editor" },
]

const PERMISSIONS = [
  {
    id: "docs",
    name: "Documents",
    permissions: [
      { id: "docs.read", name: "Read" },
      { id: "docs.write", name: "Write" },
      { id: "docs.delete", name: "Delete" },
    ],
  },
]

export function AccessSettings() {
  const [grants, setGrants] = React.useState({
    viewer: ["docs.read"],
    editor: ["docs.write"],
    admin: ["docs.delete"],
  })

  return (
    <PermissionMatrix
      roles={ROLES}
      permissions={PERMISSIONS}
      value={grants}
      onValueChange={setGrants}
    />
  )
}`,
  },
  "phone-input": {
    notes:
      'PhoneInput stores an E.164 string through value/defaultValue and onValueChange, and shows the number without its dial code next to a searchable country picker. defaultCountry (default "US") applies until the value identifies a country. While the user types, the value is the partial number so far, such as "+1415", so validate on submit with isValidPhoneNumber from libphonenumber-js. Typing a leading + switches country from the digits, and a pasted or autofilled +number also moves the dial code out of the field. Changing country keeps the national digits. countries limits the list and accepts codes or { code, name, flag } objects, in display order; excludedCountries removes entries. Both also block numbers from other countries, typed or pasted. Remaining props go to the tel input, so pass id or aria-label there; name submits the E.164 value through a hidden input. Flags are emoji, which Windows browsers show as two letters, so pass flag in countries to use images. Installs libphonenumber-js, about 36 KB gzipped.',
    example: `"use client"

import * as React from "react"

import { PhoneInput } from "@/components/ui/phone-input"

export function ContactField() {
  const [phone, setPhone] = React.useState("")

  return (
    <PhoneInput
      aria-label="Phone number"
      value={phone}
      onValueChange={setPhone}
      defaultCountry="US"
    />
  )
}`,
  },
  popover: {
    notes: SAME_AS_SHADCN,
    example: `import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function ExportPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Export size</Button>
      </PopoverTrigger>
      <PopoverContent>Pixels, applied to every frame.</PopoverContent>
    </Popover>
  )
}`,
    baseExample: `import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function ExportPopover() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Export size
      </PopoverTrigger>
      <PopoverContent>Pixels, applied to every frame.</PopoverContent>
    </Popover>
  )
}`,
  },
  "query-input": {
    notes:
      'Single-line search that reads key:value terms into Filter objects, the same type filter-builder uses. fields: FilterField[] ({ id, label, type: text | select | number | date, options? }); keys match field ids case-insensitively. Syntax: key:value is is, -key:value is is-not, key:a,b on a text or select field is is-any-of (is-none-of with -; a trailing comma, as in key:a, keeps a one-item list), key:*text* on a text field is contains, key:>7 and key:<7 compare numbers (gt, lt; key:7 is eq; >= and <= are not supported), dates take >, < and from..to (a bare date is a one-day between). Quote values with spaces: label:"needs review". A term with an unknown key, or a negated number or date, stays in the free text; a trailing key: gives a filter with an empty value, which matchesFilter treats as matching everything. onFiltersChange(filters, text) fires on every edit; value/defaultValue/onValueChange hold the raw string. Typing at the end of a term suggests keys, then select options, in a combobox: ArrowUp and ArrowDown move (ArrowDown on an empty term opens the key list, up to eight keys), Enter or Tab inserts the highlighted suggestion, Escape closes. Key suggestions start with nothing highlighted, so Enter on a plain word like auth still reaches the form; value suggestions start on the first option. Matched terms are highlighted behind the input. The lib exports parseQuery(query, fields) and formatQuery(filters, text) to convert both ways. className goes on the bordered wrapper and other props on the input.',
    example: `"use client"

import type { FilterField } from "@/lib/filter"
import { QueryInput } from "@/components/ui/query-input"

const fields: FilterField[] = [
  { id: "is", label: "State", type: "select", options: [{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }] },
  { id: "author", label: "Author", type: "text" },
  { id: "age", label: "Age in days", type: "number" },
]

export function IssueSearch({ onSearch }: { onSearch: (filters: unknown[], text: string) => void }) {
  return <QueryInput aria-label="Search issues" fields={fields} defaultValue="is:open author:me" onFiltersChange={onSearch} />
}`,
  },
  rating: {
    notes:
      'Radio group of icons for a score. Controlled with value/onValueChange or uncontrolled with defaultValue (0 means no rating). max sets the icon count (default 5), step={0.5} allows half scores, icon swaps the default lucide Star for any SVG icon. Arrow keys change the score, Home and End jump to the ends. readOnly renders a role=img labelled like "3.5 out of 5". The fill color is the root\'s text color (text-primary), so className="text-chart-4" recolors it. Pass aria-label.',
    example: `"use client"

import { useState } from "react"
import { Rating } from "@/components/ui/rating"

export function ReviewScore() {
  const [score, setScore] = useState(0)
  return <Rating aria-label="Your rating" value={score} onValueChange={setScore} step={0.5} />
}`,
  },
  "recurrence-editor": {
    notes:
      "RecurrenceEditor is a flagship RFC 5545 recurrence rule editor through value/defaultValue and onValueChange. Supports DAILY, WEEKLY with BYDAY, MONTHLY with BYMONTHDAY, ordinal BYDAY (e.g. 2TU, -1FR) and BYSETPOS (e.g. last weekday), YEARLY with BYMONTH, INTERVAL, COUNT, UNTIL, and EXDATE. Retains unhandled calendar parts (WKST, BYHOUR, X-*) without dropping or altering them on round-trip edits. Preserves exact local wall-clock time across daylight saving changes. Pass start (a Date) so weekday, month day, and preview line up with the event; showPreview={n} lists the next n occurrences. Pure helpers live in @/lib/recurrence: parseRRule, formatRRule, describeRecurrence, and occurrences. Installs number-input.",
    example: `"use client"

import { useState } from "react"
import { RecurrenceEditor } from "@/components/ui/recurrence-editor"

export function StandupRepeat({ start }: { start: Date }) {
  const [rule, setRule] = useState("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR")

  return <RecurrenceEditor aria-label="Repeat" value={rule} onValueChange={setRule} start={start} showPreview={3} />
}`,
  },
  "saved-views": {
    notes:
      "SavedViews manages named combinations of filters, sorting and columns on table and list screens. View data should be structured-cloneable, since Duplicate copies it with structuredClone. Pass currentData and the component works out isDirty by comparing it with the active view's data: plain objects compare deeply with key order and undefined fields ignored, arrays keep their order, dates compare by time, regular expressions compare by source and flags, Set members and Map values compare deeply, Map keys compare by identity, and cyclic data is safe. A view with no data is never dirty. Other class instances, such as Temporal or URL objects, need an isEqual of your own. Pass isEqual to change the rule (for filter-builder data, compare serializeFilters output so filter ids don't count), or pass isDirty to override it, which also skips the compare. Save writes currentData to the active view; Discard calls onReset so you can restore view.data. To keep the active view in the URL, pass activeId={readViewParam(searchParams, views)} and write it in onActiveChange with writeViewParam(searchParams, id). A missing or unknown id resolves to the current default view, or the first view when none is the default. Because the active view can change without onActiveChange (browser back and forward, or a new default while the URL has no param), derive the working data from activeId as the example does rather than setting it only in onActiveChange. The component itself has no router code. For server storage, return a Promise (or any thenable) from onCreate, onRename, onDuplicate, onDelete, onSetDefault or onSave. The change shows at once and the view is marked aria-busy, its options menu and rename are blocked until the request settles, and a rejected Promise (or a callback that throws) undoes only that change, shows an inline role=alert message and calls onError(error, action), or logs the error with console.error when there is no onError. Only one set default request runs at a time. Rename works with F2 or double click; delete is blocked for locked views and for the last view that is not still being created. variant='select' gives a compact dropdown. Scale limit, measured in Chrome on a dev build at 4x CPU throttle: moving between tabs takes about 60 ms with 100 views, 115 ms with 200 and 230 ms with 500, and comparing currentData with 2,000 filters takes about 2.5 ms. Keep lists to about 100 views. Pure helpers live in @/lib/saved-views. Installs button, input, badge, and popover.",
    example: `"use client"

import { useState } from "react"
import { readViewParam, writeViewParam } from "@/lib/saved-views"
import { SavedViews, type SavedView } from "@/components/ui/saved-views"

type Filters = { status: string }

const EMPTY: Filters = { status: "all" }

export function IssueViewSwitcher({
  initialViews,
  search,
  onSearchChange,
}: {
  initialViews: SavedView<Filters>[]
  search: string
  onSearchChange: (search: string) => void
}) {
  const [views, setViews] = useState(initialViews)
  const activeId = readViewParam(search, views)
  const activeView = views.find((view) => view.id === activeId)
  const [draft, setDraft] = useState<{ viewId?: string; filters: Filters }>()
  const filters =
    draft && draft.viewId === activeId
      ? draft.filters
      : (activeView?.data ?? EMPTY)

  return (
    <div className="flex flex-col gap-3">
      <SavedViews
        views={views}
        onViewsChange={setViews}
        activeId={activeId}
        onActiveChange={(id) => onSearchChange(writeViewParam(search, id))}
        currentData={filters}
        onReset={() => setDraft(undefined)}
        onSave={(view) =>
          fetch(\`/api/views/\${view.id}\`, {
            method: "PUT",
            body: JSON.stringify(view),
          }).then((res) => {
            if (!res.ok) throw new Error("Save failed")
          })
        }
      />
      <select
        aria-label="Status"
        value={filters.status}
        onChange={(event) =>
          setDraft({ viewId: activeId, filters: { status: event.target.value } })
        }
      >
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  )
}`,
  },
  "secret-field": {
    notes:
      "SecretField displays a value the user cannot edit, such as an API key or webhook secret. It shows a fixed run of 8 dots plus the last visibleChars characters (default 4); values that short or shorter stay fully masked. The reveal button is a toggle with aria-pressed, and reveal state is controlled with revealed/onRevealedChange or uncontrolled with defaultRevealed. Copy always writes the full value, even while masked, and announces Copied through a status region. Name it with aria-label or aria-labelledby. For a field the user types a secret into, use password-input.",
    example: `import { SecretField } from "@/components/ui/secret-field"

export function ApiKeyRow() {
  return <SecretField aria-label="Live API key" value="sk_live_51Mz8a1b2" visibleChars={4} />
}`,
  },
  "shortcut-cheatsheet": {
    notes:
      "Mount it once near the app root. Pressing trigger opens a dialog listing sections of shortcuts, with focus in a search field that matches shortcut labels and section titles. keys uses the same format as ShortcutRecorder ('Mod+K', not 'mod+k'), so recorded bindings can be passed straight into sections and render with the same platform symbols. trigger is '?' by default and also takes a shortcut string such as 'Mod+/'. It is ignored in text inputs, textareas, selects and contenteditable elements, and an empty string turns it off. Control open and onOpenChange to open it from a button or menu item, since mouse and touch users have no key to press. Closing returns focus to whatever opened it. If that element unmounts, as a menu item does, pass onCloseAutoFocus on Radix or finalFocus on Base UI to choose the target. If two cheatsheets share a page, give them different triggers. Escape closes it and clears the search. Installs dialog, input and shortcut-recorder.",
    example: `"use client"

import { useState } from "react"
import { ShortcutCheatsheet } from "@/components/ui/shortcut-cheatsheet"
import { Button } from "@/components/ui/button"

const sections = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: "Mod+K", label: "Search" },
      { keys: "G", label: "Go to inbox" },
    ],
  },
]

export function HelpMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>Keyboard shortcuts</Button>
      <ShortcutCheatsheet sections={sections} open={open} onOpenChange={setOpen} />
    </>
  )
}`,
  },
  "shortcut-recorder": {
    notes:
      "Click to record, then press a combination. Stores a portable string such as 'Mod+Shift+K' where Mod is Cmd on macOS and Ctrl elsewhere. requireModifier defaults to true. ShortcutKeys renders a stored shortcut as kbd elements; matchesShortcut(event, shortcut, isMac) from @/lib/shortcut checks key events.",
    example: `import { ShortcutKeys, ShortcutRecorder } from "@/components/ui/shortcut-recorder"

export function CommandMenuShortcut() {
  return (
    <div className="flex items-center gap-3">
      <ShortcutRecorder aria-label="Command menu shortcut" defaultValue="Mod+K" />
      <ShortcutKeys shortcut="Mod+Shift+P" />
    </div>
  )
}`,
  },
  "signature-pad": {
    notes:
      'SignaturePad captures a signature drawn with mouse, pen or touch, or typed through the "Type instead" fallback that keeps it usable from the keyboard and with a screen reader. onValueChange fires at the end of each stroke with SVG markup, or a PNG data URL when format="png", and with an empty string when nothing is signed. penColor takes any CSS color; currentColor is kept in the SVG so it inherits where it is inlined, and every other color is resolved at export. Set value to an earlier export to show it as a saved signature, which Clear removes before the signer can redraw. Set value to "" to reset the pad. Pass name to submit the value with a form, and aria-label to name the pad. The pure helpers exportSignature and strokeToPath live in @/lib/signature-pad. Installs button and input.',
    example: `"use client"

import { useState } from "react"
import { SignaturePad } from "@/components/ui/signature-pad"

export function DeliveryConfirmation() {
  const [signature, setSignature] = useState("")

  return <SignaturePad aria-label="Delivery signature" value={signature} onValueChange={setSignature} format="svg" penColor="currentColor" />
}`,
  },
  "sortable-list": {
    notes:
      "Reorderable list built on Motion's Reorder: the dragged row follows the pointer, neighbours spring out of the way, and the page or a scrollable parent scrolls near its edges. Controlled with value/onValueChange or uncontrolled with defaultValue. onValueChange fires once, on drop, and only if the order changed; the render function gets the live index during a move. Space/Enter picks up or drops an item, ArrowUp/ArrowDown (or ArrowLeft/ArrowRight for horizontal) moves it, Home/End jump to the ends, and Escape cancels a keyboard or pointer move. Moving focus away drops the item. Screen readers receive live status announcements. Add SortableDragHandle to limit dragging to a grip, which also leaves touch scrolling and text selection working on the row. Without a handle, the row drags from anywhere except links, buttons and form controls inside it. If the list sits in an overflow container that can scroll, wrap that container in motion.div with layoutScroll.",
    example: `import {
  SortableDragHandle,
  SortableItem,
  SortableList,
} from "@/components/ui/sortable-list"

const tasks = [
  { id: "1", title: "Review pull requests" },
  { id: "2", title: "Update documentation" },
]

export function TaskList() {
  return (
    <SortableList defaultValue={tasks} getKey={(task) => task.id}>
      {(task) => (
        <SortableItem key={task.id} value={task.id}>
          <SortableDragHandle />
          <span>{task.title}</span>
        </SortableItem>
      )}
    </SortableList>
  )
}`,
  },
  stepper: {
    notes:
      "Built on Radix Tabs, or Base UI Tabs from the Base UI registry. Steps are zero-based numbers: value/defaultValue/onValueChange. linear disables steps beyond the furthest one reached. Compose StepperList > StepperItem(step) > StepperTrigger > StepperIndicator + StepperTitle, plus StepperSeparator and StepperContent(step). StepperNext and StepperPrevious support asChild; pass stepCount so Next disables on the last step. useStepper() exposes activeStep and setActiveStep.",
    example: `import { Button } from "@/components/ui/button"
import {
  Stepper, StepperContent, StepperIndicator, StepperItem, StepperList,
  StepperNext, StepperPrevious, StepperSeparator, StepperTitle, StepperTrigger,
} from "@/components/ui/stepper"

const steps = ["Account", "Workspace", "Invite"]

export function OnboardingSteps() {
  return (
    <Stepper linear stepCount={steps.length}>
      <StepperList aria-label="Onboarding">
        {steps.map((title, index) => (
          <StepperItem key={title} step={index}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{title}</StepperTitle>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>
        ))}
      </StepperList>
      {steps.map((title, index) => (
        <StepperContent key={title} step={index}>{title} form goes here</StepperContent>
      ))}
      <div className="flex justify-between">
        <StepperPrevious asChild><Button variant="outline">Back</Button></StepperPrevious>
        <StepperNext asChild><Button>Continue</Button></StepperNext>
      </div>
    </Stepper>
  )
}`,
  },
  "tags-input": {
    notes:
      "Controlled with value/onValueChange or uncontrolled with defaultValue. Enter or comma adds a tag, Backspace or ArrowLeft with the caret at the start selects a tag (announced to screen readers), a second Backspace removes it, pasting splits on commas, tabs and newlines. Props: max (the field turns read-only when full, so tags stay removable by keyboard), validate(tag) => boolean, allowDuplicates, addOnBlur. Spreads remaining props onto the inner input, so id, placeholder and aria-invalid work.",
    example: `import { Label } from "@/components/ui/label"
import { TagsInput } from "@/components/ui/tags-input"

export function EnvironmentsField() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="environments">Environments</Label>
      <TagsInput id="environments" defaultValue={["staging"]} max={6} placeholder="Add environment" />
    </div>
  )
}`,
  },
  "template-input": {
    notes:
      "Textarea for text with {{placeholders}}, such as email subjects, notification templates and webhook payloads. Typing {{ opens a list of variables filtered on value and label; ArrowUp and ArrowDown move, Enter or Tab inserts {{value}}, Escape closes. {{ works after any character, as in id-{{name. variables: { value, label, description? }[] (the MentionOption type). The value stays a plain string with value/defaultValue/onValueChange. Variables are highlighted in a layer drawn behind the textarea, so native undo, selection and caret behaviour are untouched. A {{name}} that is not in variables gets a wavy underline and is named in the textarea's accessible description; findUnknownVariables(text, variables) from the lib returns those names for form validation. className goes on the bordered wrapper and other props go on the textarea, so aria-label, placeholder, rows and aria-invalid work.",
    example: `import { TemplateInput } from "@/components/ui/template-input"

const variables = [
  { value: "first_name", label: "First name" },
  { value: "order_id", label: "Order number" },
]

export function SubjectField() {
  return <TemplateInput aria-label="Subject" variables={variables} defaultValue="Hi {{first_name}}, order {{order_id}} shipped" />
}`,
  },
  theme: {
    notes:
      "Neutral oklch tokens for light and dark mode, written into the project's global CSS. Optional: components read whatever tokens the project already has.",
  },
  "time-field": {
    notes:
      "Segmented time input with value 'HH:mm' in 24 hour time (empty string when unset). hourCycle 12 adds an AM/PM segment, minuteStep sets the arrow key step, name submits through a hidden input. The root is role=group, so pass aria-label or aria-labelledby.",
    example: `import { TimeField } from "@/components/ui/time-field"

export function StandupTimeField() {
  return <TimeField aria-label="Standup time" defaultValue="09:30" hourCycle={12} minuteStep={15} />
}`,
  },
  timeline: {
    notes:
      "Presentational and server-component safe. TimelineIndicator takes variant: default | current | success | destructive. Wrap text in TimelineContent, with TimelineHeader holding TimelineTitle and TimelineTime.",
    example: `import {
  Timeline, TimelineContent, TimelineDescription, TimelineHeader,
  TimelineIndicator, TimelineItem, TimelineTime, TimelineTitle,
} from "@/components/ui/timeline"

export function DeployHistory() {
  return (
    <Timeline>
      <TimelineItem>
        <TimelineIndicator variant="current" />
        <TimelineContent>
          <TimelineHeader>
            <TimelineTitle>Deployed to production</TimelineTitle>
            <TimelineTime dateTime="2026-10-27T14:32">14:32</TimelineTime>
          </TimelineHeader>
          <TimelineDescription>v2.14.0 rolled out to 3 replicas.</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  )
}`,
  },
  "timezone-picker": {
    notes:
      'TimezonePicker holds an IANA name such as "Asia/Tokyo" through value/defaultValue and onValueChange; an empty string shows the placeholder. The list comes from Intl.supportedValuesOf("timeZone"), sorted by UTC offset, and each row shows the offset and current local time read when the popover opens, so offsets follow daylight saving. Old names that V8 still lists, such as Asia/Calcutta, show under their current names (Asia/Kolkata), and an old name passed as value still marks the right row. Search matches the name with spaces or underscores ("new york" finds America/New_York) and offsets ("+5:30"). timeZones limits the list. It does not default to the browser zone, because the server cannot know it; read Intl.DateTimeFormat().resolvedOptions().timeZone on the client and pass it as value. Remaining props go to the trigger button, so label it with a Label and id or with aria-label.',
    example: `"use client"

import { useState } from "react"
import { TimezonePicker } from "@/components/ui/timezone-picker"

export function TimezoneSetting() {
  const [timeZone, setTimeZone] = useState("Europe/London")

  return <TimezonePicker aria-label="Time zone" value={timeZone} onValueChange={setTimeZone} />
}`,
  },
  toast: {
    notes:
      'Radix: registry/default/ui/sonner.tsx installs as components/ui/sonner.tsx and wraps sonner, so every shadcn Sonner call and Toaster prop works. Base UI installs components/ui/toast.tsx with shadcn\'s toast API (toast.add({ title, type })). Render Toaster once near the root. Import toast from the component file instead of from sonner to get the additions. toast.undo delays a destructive action until the toast goes away (onCommit) unless Undo or its shortcut ("Mod+Z") runs onUndo, and it commits on pagehide. toast.progress shows a determinate bar; update it by id and finish with a success toast on the same id. Toasts that reuse an id (Radix) or key (Base UI) merge into one with a ×N badge and a restarted timer. Durations grow with text length. Error toasts are announced assertively. persist: true sends the toast to onToastPersist listeners when it closes, ready for NotificationInbox.',
    example: `"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"

export function DeleteFiles({ ids, deleteFiles, setHidden }: { ids: string[]; deleteFiles: (ids: string[]) => void; setHidden: (hidden: boolean) => void }) {
  function remove() {
    setHidden(true)
    toast.undo(\`Deleted \${ids.length} files\`, {
      shortcut: "Mod+Z",
      onCommit: () => deleteFiles(ids),
      onUndo: () => setHidden(false),
    })
  }

  return <Button variant="destructive" onClick={remove}>Delete</Button>
}`,
  },
  tour: {
    notes:
      "Wrap the page in Tour with steps: TourStep[] ({ target, title, description?, side? }) and mark elements with TourTarget name matching step.target. open/onOpenChange and step/onStepChange are optional controlled props; onComplete fires after the last step. Focus is trapped in the tour card and returns to the opener on close.",
    example: `"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tour, TourTarget, type TourStep } from "@/components/ui/tour"

const steps: TourStep[] = [{ target: "create", title: "Create a project", description: "Start here." }]

export function DashboardTour() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Tour steps={steps} open={isOpen} onOpenChange={setIsOpen}>
      <TourTarget name="create"><Button>New project</Button></TourTarget>
      <Button variant="ghost" onClick={() => setIsOpen(true)}>Take the tour</Button>
    </Tour>
  )
}`,
  },
  "trace-waterfall": {
    notes:
      "Hierarchical trace waterfall visualizing distributed request spans and execution profiles. spans: Span[] with id, parentId?, name, start, duration, status? ('ok' | 'error' | 'warning'), service?, color?. Spans with missing parentId render as root spans. Full WAI-ARIA tree keyboard navigation: ArrowUp/ArrowDown move focus, ArrowRight expands or enters children, ArrowLeft collapses or moves to parent, Home/End jump to first/last span, Enter/Space select. Controlled or uncontrolled with expandedSpanIds/onExpandedChange and selectedSpanId/onSpanSelect. Zero-duration spans render with minBarWidth (default 4px). A header summarizes the root span, total time, span, service and error counts, with a legend mapping each service to its color. Services get --chart-* colors in first-seen order (they repeat after five); error spans get a striped bg-destructive bar, a warning icon and red text. Rows show the full span name (wrapping at . / _ : -), the service and the duration. Selecting a span opens a details panel with duration, share of trace, start offset, status, id and attributes; pass showSpanDetails={false} to render your own from onSpanSelect.",
    example: `import { TraceWaterfall, type Span } from "@/components/ui/trace-waterfall"

const spans: Span[] = [
  { id: "1", name: "GET /orders", start: 0, duration: 240, service: "gateway" },
  { id: "2", parentId: "1", name: "SELECT orders", start: 18, duration: 90, status: "error", service: "postgres" },
]

export function RequestTrace() {
  return <TraceWaterfall spans={spans} />
}`,
  },
  "transfer-list": {
    notes:
      "Move items between two listboxes: items: T[] with id and label, value/onValueChange or defaultValue as string[] representing target items. Ids in value that are not in items are preserved. Supports searchable for a search input per panel, showSelectAll, disabled, and custom renderItem. Select all, move selected and move all act on the items the search leaves visible. Each listbox is one tab stop: Arrow keys, Home and End move focus, Space or Enter toggles an item, Shift extends the selection, and double-click moves an item straight across.",
    example: `import { TransferList } from "@/components/ui/transfer-list"

const roles = [
  { id: "read", label: "Read" },
  { id: "write", label: "Write" },
  { id: "admin", label: "Admin" },
]

export function PermissionsField() {
  return (
    <TransferList
      items={roles}
      defaultValue={["read"]}
      titles={["Available", "Assigned"]}
      searchable
    />
  )
}`,
  },
  "tree-view": {
    notes:
      'WAI-ARIA tree driven by an items array of TreeNode { id, label, icon?, children?, isBranch?, disabled?, textValue? }. expanded/onExpandedChange and selected/onSelectedChange are optional controlled props. A node with isBranch: true and children undefined renders a loading row while expanded; pass loadChildren(node) => Promise, add the children to items before it resolves, and a rejection shows a Retry row (ArrowRight on the branch also retries). multiple switches to checkboxes: selected is string[] of every checked id, and a partly checked branch shows aria-checked="mixed". Space checks any node; Enter expands a branch and checks a leaf. virtual renders only the visible rows plus overscan, at 32px each, and needs a height in className; use it past about 1,000 open rows. At 100,000 open rows, expanding takes about 17 ms and a scroll about 9 ms; browsers stop scrolling at about 520,000. Always pass aria-label.',
    example: `import { TreeView, type TreeNode } from "@/components/ui/tree-view"

const items: TreeNode[] = [
  { id: "app", label: "app", children: [{ id: "app/page", label: "page.tsx" }] },
  { id: "archive", label: "archive", isBranch: true },
]

export function ProjectTree() {
  return <TreeView aria-label="Project files" items={items} defaultExpanded={["app"]} />
}`,
  },
  "unit-input": {
    notes:
      "Number field plus a native unit select for memory limits, storage quotas, upload caps and bandwidth. value and onValueChange take number | null in the base unit (bytes for the presets), so the parent never converts. A unit is { id, label, factor }, where factor is how many base units one of it holds. BYTE_UNITS (B, KB, MB, GB, TB, powers of 1000) and BINARY_BYTE_UNITS (B, KiB, MiB, GiB, TiB, powers of 1024) are exported from the lib file, and units defaults to BYTE_UNITS. Changing the unit converts the number on screen and leaves the stored value alone, so 512 MB becomes 0.512 GB. Typing 2gb or 512 MiB sets the unit as well as the number, matched against unit ids and labels, case-insensitive. Typed units must be a single word, so give multiword labels a short id such as GBps. defaultUnit, or unit with onUnitChange, picks the unit; without one the largest unit that keeps the number at 1 or more is used. min and max are in base units. step is in the current unit, Shift with the arrows, or PageUp and PageDown, steps by ten, Home and End jump to min and max, and Enter or blur applies typed text. Unknown units revert the text. name submits the base value through a hidden input.",
    example: `import { BYTE_UNITS } from "@/lib/unit-input-utils"
import { UnitInput } from "@/components/ui/unit-input"

export function MemoryLimitField({
  value,
  onChange,
}: {
  value: number | null
  onChange: (bytes: number | null) => void
}) {
  return (
    <UnitInput
      aria-label="Memory limit"
      value={value}
      onValueChange={onChange}
      units={BYTE_UNITS}
      defaultUnit="MB"
      min={128_000_000}
      max={10_000_000_000}
    />
  )
}`,
  },
  "uptime-bar": {
    notes:
      "Renders daily service health segments with overall uptime percentage, single tab stop roving keyboard navigation, and popover day details. Days with no data do not count against uptime. Degraded days count as partial uptime via degradedWeight (default 0.5). Arrow keys (ArrowLeft, ArrowRight, Home, End) move focus between segments, and Enter or Space opens the Popover. Theme tokens bg-chart-2 (operational), bg-chart-5 (degraded), bg-destructive (down), and bg-muted (no-data) provide color coding.",
    example: `import { UptimeBar } from "@/components/ui/uptime-bar"

const days = [
  { date: "2026-10-30", status: "operational" as const },
  { date: "2026-10-31", status: "degraded" as const, note: "Elevated API latency" },
]

export function ServiceHealth() {
  return <UptimeBar title="API" days={days} />
}`,
  },
  "use-controllable-state": {
    notes:
      "Hook shared by several components to support both controlled (value + onValueChange) and uncontrolled (defaultValue) use. Installed automatically as a dependency.",
  },
  "use-copy-to-clipboard": {
    notes:
      "Hook returning copy(text, key?) and copied, the key of the last copy (or null once 1.6 seconds pass). Installed automatically by description-list and json-viewer.",
  },
  utils: {
    notes:
      "Installs lib/utils.ts with the cn() class merging helper. Every component depends on it.",
  },
  "virtual-list": {
    notes:
      "Renders only the rows in view plus overscan (default 4 on each side). Give the list a fixed height through className, a row size guess through estimateSize, and a render function as children. Rows measure themselves, so heights can vary, and a row growing above the viewport does not shift what is on screen. Pass getItemKey for any list that can reorder or take inserts, so measured heights and focus follow the item rather than the index. The list has one tab stop. Arrow keys, PageUp, PageDown, Home and End move between rows, including rows not mounted yet, and the focused row stays mounted while scrolled away. Arrow keys typed inside a control in a row stay with that control. Pass aria-label to name the list.",
    example: `import { VirtualList } from "@/components/ui/virtual-list"

export function DeployLog({ lines }: { lines: { id: string; text: string }[] }) {
  return (
    <VirtualList
      aria-label="Deploy log"
      items={lines}
      estimateSize={32}
      getItemKey={(line) => line.id}
      className="h-96 rounded-lg border"
    >
      {(line) => <div className="px-3 py-1.5 font-mono text-xs">{line.text}</div>}
    </VirtualList>
  )
}`,
  },
}
