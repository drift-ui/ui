type ComponentUsage = {
  notes: string
  example?: string
  baseExample?: string
}

const SAME_AS_SHADCN =
  "Identical API to the shadcn/ui component of the same name. Skip it if the project already has one."

export const COMPONENT_USAGE: Record<string, ComponentUsage> = {
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
  "date-time-range": {
    notes:
      "DateTimeRangePicker with value/defaultValue of { from?: Date, to?: Date } and onValueChange. Start and end times default to 09:00 and 17:00 and are edited with two TimeFields in the popover. locale formats the trigger and picks a 12 or 24 hour clock. presets takes { label, value } items; build them once (useState or useMemo) so the pressed preset still matches after a re-render. min and max disable days outside the bounds and clamp times on the edge days. Editing a day or time never puts the end before the start, and a preset with its end before its start is disabled. The local time zone is shown next to each time; the picker does not convert zones. Other props go to the trigger button, so pass id for a Label. Installs the shadcn calendar and popover and drift's time-field.",
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
      "Compares two strings line by line with no dependencies. mode is split (default) or unified, and the component holds no mode state, so a mode switch belongs to the parent. Replaced lines that share a word get word-level highlights in ins and del elements. Runs of unchanged lines beyond contextLines (default 3) collapse behind a Show N unchanged lines button that stays in place as Hide once open, so keyboard focus stays on it. Added lines use the chart-2 token and removed lines use destructive; every changed line also has a + or - sign and screen reader text, so color is not the only signal. Past 2000 edits the middle of the text is shown as one full replacement, which keeps two unrelated large inputs from using unbounded memory. Pass aria-label to name the table.",
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
      "Read-only JSON tree built on tree-view, so arrow keys, Home, End and typeahead work. Pass virtual for large payloads (tested up to 50 MB / 100k items) to keep 60fps scrolling and memory low. Search uses deferred value updates to eliminate typing lag. Filter paths using dot notation or wildcards (e.g. users[*].email or *.id) via the pathFilter prop or the toolbar path filter toggle. Long strings exceeding maxStringLength (default 80) or containing newlines truncate with inline Show more and Show less toggles, while copying (hover button or Ctrl/Cmd+C) always copies the full untruncated string. defaultExpandDepth (default 1) controls initial expansion. Strings, numbers and booleans use chart-2, chart-1 and chart-3 tokens mixed with foreground for readable contrast, and null uses muted text. Arrays over 100 items split into groups of 100.",
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
      "Textarea that opens a suggestion list when the caret follows a trigger character. triggers maps a character to options, for example { '@': people, '#': channels }, each option { value, label, description? }. Selecting inserts trigger + value. Value is plain text with value/defaultValue/onValueChange.",
    example: `import { MentionTextarea } from "@/components/ui/mention-textarea"

const people = [{ value: "noor", label: "Noor Haddad" }, { value: "tomasz", label: "Tomasz Wierzba" }]

export function CommentBox() {
  return <MentionTextarea aria-label="Comment" placeholder="Write a comment" triggers={{ "@": people }} />
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
      "RecurrenceEditor edits an RFC 5545 RRULE string (without the RRULE: prefix) through value/defaultValue and onValueChange. Supports DAILY, WEEKLY with BYDAY, MONTHLY with BYMONTHDAY or an ordinal BYDAY such as 2TU or -1FR, YEARLY, INTERVAL, COUNT and UNTIL. Pass start (a Date) so weekday, month day and preview line up with the event; showPreview={n} lists the next n occurrences. Pure helpers live in @/lib/recurrence: parseRRule, formatRRule, describeRecurrence and occurrences. Installs number-input.",
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
      "SavedViews manages named combinations of filters, sorting and columns on table and list screens. For views that store configuration data, manage views and onViewsChange in controlled state, or pass currentData to attach to newly created views; data must be serializable if using duplicate. When isDirty is true, an unsaved indicator appears and Save/Discard buttons show up. Context menu on each view supports Rename (also accessible via F2 or double click), Duplicate, Set as default, and Delete (with safety guards against deleting the last view or locked views). Add button (+) creates a new view. Set variant='select' for a compact dropdown view switcher. Pure helpers live in @/lib/saved-views: createSavedView, duplicateSavedView, renameSavedView, deleteSavedView, and setDefaultSavedView. Installs button, input, badge, and popover.",
    example: `"use client"

import { useState } from "react"
import { SavedViews, type SavedView } from "@/components/ui/saved-views"

const INITIAL_VIEWS: SavedView<{ status: string }>[] = [
  { id: "all", name: "All Issues", isDefault: true, data: { status: "all" } },
  { id: "active", name: "Active Sprint", data: { status: "active" } },
]

export function IssueViewSwitcher() {
  const [views, setViews] = useState(INITIAL_VIEWS)
  const [activeId, setActiveId] = useState("all")
  const [isDirty, setIsDirty] = useState(false)

  return (
    <SavedViews
      views={views}
      onViewsChange={setViews}
      activeId={activeId}
      onActiveChange={setActiveId}
      isDirty={isDirty}
      onSave={(view) => setIsDirty(false)}
      onReset={(view) => setIsDirty(false)}
    />
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
