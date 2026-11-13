export type ApiProp = {
  name: string
  type: string
  default?: string
  required?: boolean
  description: string
}

export type ApiPart = {
  name: string
  signature?: string
  description: string
  props?: ApiProp[]
  rest?: string
}

const STATE_PROPS = {
  value: (type: string, what: string): ApiProp => ({
    name: "value",
    type,
    description: `Controlled ${what}.`,
  }),
  defaultValue: (type: string, initial: string): ApiProp => ({
    name: "defaultValue",
    type,
    default: initial,
    description: "Initial value when uncontrolled.",
  }),
  onValueChange: (type: string, when: string): ApiProp => ({
    name: "onValueChange",
    type,
    description: `Called ${when}.`,
  }),
}

export const COMPONENT_API: Record<string, ApiPart[]> = {
  "activity-heatmap": [
    {
      name: "ActivityHeatmap",
      description:
        "Displays activity intensity over a year in a WAI-ARIA grid with 2D keyboard navigation and accessible cell labels.",
      props: [
        {
          name: "data",
          type: "ActivityDayInput[]",
          required: true,
          description:
            "Array of daily activity objects with date (YYYY-MM-DD), count, and optional level override.",
        },
        {
          name: "weekStartsOn",
          type: "0 | 1 | 2 | 3 | 4 | 5 | 6",
          default: "0",
          description: "Starting day of the week (0 for Sunday, 1 for Monday).",
        },
        {
          name: "startDate",
          type: "string",
          description:
            "Earliest calendar date in YYYY-MM-DD. Defaults to 52 weeks before endDate.",
        },
        {
          name: "endDate",
          type: "string",
          description:
            "Latest calendar date in YYYY-MM-DD. Defaults to latest date in data or today.",
        },
        {
          name: "selectedDate",
          type: "string | null",
          description: "Controlled selected date in YYYY-MM-DD.",
        },
        {
          name: "defaultSelectedDate",
          type: "string | null",
          description: "Initial selected date when uncontrolled.",
        },
        {
          name: "onDaySelect",
          type: "(day: ActivityDay) => void",
          description: "Callback invoked when a day cell is selected.",
        },
        {
          name: "thresholds",
          type: "number[]",
          description:
            "Four-element array of count thresholds separating intensity levels 1 through 4.",
        },
        {
          name: "unit",
          type: "string",
          default: '"contributions"',
          description:
            "Noun describing the activity unit for screen readers and summary.",
        },
        {
          name: "showSummary",
          type: "boolean",
          default: "true",
          description: "Whether to display the total activity summary header.",
        },
        {
          name: "summary",
          type: "ReactNode | ((total: number, start: string, end: string) => ReactNode)",
          description: "Custom summary content or render function.",
        },
        {
          name: "showLegend",
          type: "boolean",
          default: "true",
          description: "Whether to render the Less/More intensity level key.",
        },
        {
          name: "showMonthLabels",
          type: "boolean",
          default: "true",
          description: "Whether to render month labels above week columns.",
        },
        {
          name: "showWeekdayLabels",
          type: "boolean",
          default: "true",
          description: "Whether to render weekday labels along the left side.",
        },
        {
          name: "levelColors",
          type: "Record<number, string>",
          description:
            "Custom CSS class overrides for intensity levels 0 through 4.",
        },
        {
          name: "showTooltip",
          type: "boolean",
          default: "true",
          description:
            "Whether to render a floating tooltip on hover and focus.",
        },
        {
          name: "renderTooltip",
          type: "(day: ActivityDay) => ReactNode",
          description:
            "Custom tooltip content render function receiving the active day.",
        },
        {
          name: "aria-label",
          type: "string",
          default: '"Activity heatmap"',
          description: "Accessible label for the grid widget.",
        },
      ],
      rest: "div",
    },
  ],
  avatar: [
    {
      name: "Avatar",
      description:
        "Same API as the shadcn/ui Avatar. Skip it if the project already has one. A circular size-8 frame. Set another size or radius with className.",
      rest: "Avatar root",
    },
    {
      name: "AvatarImage",
      description:
        "The image. It is hidden until it loads and if it fails. Pass src and alt.",
      rest: "Avatar image",
    },
    {
      name: "AvatarFallback",
      description: "Shown while there is no image, usually initials.",
      rest: "Avatar fallback",
    },
  ],
  "avatar-group": [
    {
      name: "AvatarGroup",
      description:
        "Stacks its AvatarGroupItem children with overlap. Avatars past max collapse into a +N button that opens a popover listing them. Pass aria-label.",
      props: [
        {
          name: "max",
          type: "number",
          description: "Most avatars shown before the +N button.",
        },
      ],
      rest: "<div>",
    },
    {
      name: "AvatarGroupItem",
      description:
        "One avatar built on the shadcn Avatar, with initials as the fallback and an optional presence dot.",
      props: [
        {
          name: "name",
          type: "string",
          required: true,
          description:
            "Used for the initials, the tooltip and the screen reader label.",
        },
        { name: "src", type: "string", description: "Image URL." },
        {
          name: "status",
          type: '"online" | "away" | "busy" | "offline"',
          description: "Adds a presence dot and reads the status aloud.",
        },
      ],
      rest: "<span>",
    },
  ],
  badge: [
    {
      name: "Badge",
      description:
        "Same API as the shadcn/ui Badge. Skip it if the project already has one.",
      props: [
        {
          name: "variant",
          type: '"default" | "secondary" | "destructive" | "outline"',
          default: '"default"',
          description: "Color treatment.",
        },
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description:
            "Radix: render the child element with the badge styles. In Base UI, use the render prop.",
        },
      ],
      rest: "<span>",
    },
    {
      name: "badgeVariants",
      description:
        "The class generator behind Badge, for styling your own element.",
    },
  ],
  "bulk-action-bar": [
    {
      name: "BulkActionBar",
      description:
        "A floating toolbar that springs in while something is selected. Put BulkActionBarButton children inside. Needs the motion package.",
      props: [
        {
          name: "selectedCount",
          type: "number",
          required: true,
          description:
            "Number of selected items. The bar shows while it is above 0.",
        },
        {
          name: "onClear",
          type: "() => void",
          required: true,
          description: "Called by the clear button and by Escape.",
        },
        {
          name: "placement",
          type: '"viewport" | "container"',
          default: '"viewport"',
          description:
            "viewport portals the bar to the bottom of the screen, container positions it inside the nearest relative parent.",
        },
        {
          name: "aria-label",
          type: "string",
          default: '"Bulk actions"',
          description: "Name of the toolbar.",
        },
      ],
      rest: "Toolbar root",
    },
    {
      name: "BulkActionBarButton",
      description: "A Button that joins the toolbar's arrow key navigation.",
      props: [
        {
          name: "variant",
          type: "Button variant",
          default: '"ghost"',
          description: "Button style.",
        },
        {
          name: "size",
          type: "Button size",
          default: '"sm"',
          description: "Button size.",
        },
      ],
      rest: "Button",
    },
  ],
  button: [
    {
      name: "Button",
      description:
        "Same API as the shadcn/ui Button. Skip it if the project already has one.",
      props: [
        {
          name: "variant",
          type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"',
          default: '"default"',
          description: "Color treatment.",
        },
        {
          name: "size",
          type: '"default" | "sm" | "lg" | "icon"',
          default: '"default"',
          description: "Height and padding. Give icon buttons an aria-label.",
        },
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description:
            "Radix: render the child element with the button styles. In Base UI, use the render prop.",
        },
      ],
      rest: "<button>",
    },
    {
      name: "buttonVariants",
      description:
        "The class generator behind Button, for styling a link or a popover trigger.",
    },
  ],
  card: [
    {
      name: "Card",
      description:
        "Same API as the shadcn/ui Card. Skip it if the project already has one. Compose CardHeader, CardContent and CardFooter inside it, and leave out what you do not need.",
      rest: "<div>",
    },
    {
      name: "CardHeader",
      description:
        "Holds CardTitle, CardDescription and CardAction. CardAction sits at the top right.",
      rest: "<div>",
    },
    {
      name: "CardTitle, CardDescription",
      description:
        "The heading text and the muted line under it. Both render a div, so add a heading element if the page outline needs one.",
      rest: "<div>",
    },
    {
      name: "CardAction",
      description: "A slot in the header for a badge or a button.",
      rest: "<div>",
    },
    {
      name: "CardContent, CardFooter",
      description: "The body and a flex row for actions.",
      rest: "<div>",
    },
  ],
  "color-picker": [
    {
      name: "ColorPicker",
      description:
        "A trigger button that opens a saturation and brightness area, hue and alpha sliders, a hex field, an oklch readout and, where the browser has it, the EyeDropper.",
      props: [
        STATE_PROPS.value("string", 'hex color, "#rrggbb" or "#rrggbbaa"'),
        STATE_PROPS.defaultValue("string", '"#000000"'),
        STATE_PROPS.onValueChange(
          "(hex: string) => void",
          "with the new hex color"
        ),
        {
          name: "showAlpha",
          type: "boolean",
          default: "true",
          description: "Show the opacity slider.",
        },
        {
          name: "swatches",
          type: "string[]",
          description: "Preset hex colors shown as buttons.",
        },
        {
          name: "variant",
          type: "Button variant",
          default: '"outline"',
          description: "Style of the trigger button.",
        },
        {
          name: "size",
          type: "Button size",
          description: "Size of the trigger button.",
        },
      ],
      rest: "trigger <button>",
    },
  ],
  "comment-thread": [
    {
      name: "CommentThread",
      description:
        "A single review thread. Top-level comments can have one level of replies; replying to a reply adds to the same top-level comment and starts the draft with @author when the author's id is a mention value. Ctrl or Cmd+Enter submits, Escape cancels an edit, a reply or a delete confirmation, and the reaction picker moves with the Left and Right arrow keys, Home and End.",
      props: [
        {
          name: "comments",
          type: "Comment[]",
          description:
            "Controlled comments. Top-level comments render in array order, each followed by its replies in array order.",
        },
        {
          name: "defaultComments",
          type: "Comment[]",
          default: "[]",
          description: "Initial comments when uncontrolled.",
        },
        {
          name: "onCommentsChange",
          type: "(comments: Comment[]) => void",
          description:
            "Called with the full list after a comment is posted, edited or deleted, or a reaction changes.",
        },
        {
          name: "currentUser",
          type: "CommentAuthor",
          description:
            "The person writing. Edit and delete appear only on comments whose author.id matches. Leave it out for a read-only thread with no composer, actions or reaction toggles.",
        },
        {
          name: "mentionSuggestions",
          type: "MentionOption[]",
          default: "[]",
          description:
            "People offered after @ in the composer. An @value in a body is highlighted only when value is in this list.",
        },
        {
          name: "reactions",
          type: "ReactionOption[]",
          default: "QUICK_REACTIONS",
          description:
            "Emoji offered in the reaction picker, each { emoji, label }. The default is 👍 👎 😄 🎉 😕 ❤️ 🚀 👀.",
        },
        {
          name: "resolved",
          type: "boolean",
          description:
            "Controlled resolved state. A resolved thread collapses to a summary row with Show thread, plus Reopen when currentUser is set.",
        },
        {
          name: "defaultResolved",
          type: "boolean",
          default: "false",
          description: "Initial resolved state when uncontrolled.",
        },
        {
          name: "onResolvedChange",
          type: "(resolved: boolean) => void",
          description: "Called when someone resolves or reopens the thread.",
        },
        {
          name: "resolvedBy",
          type: "CommentAuthor",
          description:
            "Shown as Resolved by name. Falls back to currentUser when the thread was resolved in this session.",
        },
        {
          name: "onReply",
          type: "(parentId: string | null, body: string, mentions: string[]) => void | Promise<void>",
          description:
            "Called with the trimmed body and the mentioned values. parentId is null for a new top-level comment. The comment is added after the promise resolves; if it rejects, the draft stays and an error shows.",
        },
        {
          name: "onEdit",
          type: "(id: string, body: string, mentions: string[]) => void | Promise<void>",
          description:
            "Called when an edit is saved with different text. Same promise handling as onReply.",
        },
        {
          name: "onDelete",
          type: "(id: string) => void | Promise<void>",
          description:
            "Called after the delete is confirmed. A comment with replies becomes a deleted placeholder; one without is removed. If the promise rejects, the comment stays.",
        },
        {
          name: "onReactionToggle",
          type: "(id: string, emoji: string) => void",
          description:
            "Called after the current user adds or removes a reaction.",
        },
        {
          name: "now",
          type: "Date",
          description:
            "Reference time for relative timestamps. Without it the thread uses the current time and updates every minute.",
        },
        {
          name: "locale",
          type: "string",
          description:
            "Locale for relative and absolute timestamps. Defaults to the browser locale.",
        },
        {
          name: "aria-label",
          type: "string",
          default: '"Comment thread"',
          description: "Accessible name of the thread region.",
        },
      ],
      rest: "<section>",
    },
    {
      name: "Comment",
      description: "One comment or reply.",
      props: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Unique id.",
        },
        {
          name: "parentId",
          type: "string | null",
          description:
            "The comment this replies to. Missing parents make it a top-level comment.",
        },
        {
          name: "author",
          type: "CommentAuthor",
          required: true,
          description:
            "{ id: string; name: string; avatarUrl?: string }. Initials show when there is no avatarUrl or it fails to load.",
        },
        {
          name: "body",
          type: "string",
          required: true,
          description:
            "Plain text. Line breaks are kept and HTML is shown as text.",
        },
        {
          name: "createdAt",
          type: "Date | string",
          required: true,
          description:
            "Any value new Date() accepts. An invalid date hides the timestamp.",
        },
        {
          name: "editedAt",
          type: "Date | string",
          description: "Shows (edited) with the time in its tooltip.",
        },
        {
          name: "deleted",
          type: "boolean",
          description:
            "Shows a deleted placeholder while the comment has replies, and hides it otherwise.",
        },
        {
          name: "reactions",
          type: "{ emoji: string; userIds: string[] }[]",
          description:
            "Each emoji and who reacted. Names come from the thread's authors and currentUser.",
        },
      ],
    },
  ],
  "cron-input": [
    {
      name: "CronInput",
      description:
        "A standard five-field cron expression input with plain-English schedule readout and upcoming run times.",
      props: [
        {
          name: "value",
          type: "string",
          description: "Controlled cron expression value.",
        },
        {
          name: "defaultValue",
          type: "string",
          default: '"* * * * *"',
          description: "Initial value in uncontrolled mode.",
        },
        {
          name: "onValueChange",
          type: "(value: string) => void",
          description: "Fires whenever the cron expression text changes.",
        },
        {
          name: "placeholder",
          type: "string",
          default: '"* * * * *"',
          description: "Placeholder text for the cron input field.",
        },
        {
          name: "showDescription",
          type: "boolean",
          default: "true",
          description:
            "Whether to display the plain-English schedule readout below the input.",
        },
        {
          name: "showNextRuns",
          type: "boolean",
          default: "true",
          description:
            "Whether to show the list of upcoming calculated run times.",
        },
        {
          name: "nextRunsCount",
          type: "number",
          default: "5",
          description: "Number of upcoming run times to calculate and display.",
        },
        {
          name: "nextRunsFrom",
          type: "Date",
          description:
            "Reference date for upcoming runs calculation. Defaults to current time.",
        },
        {
          name: "formatNextRun",
          type: "(date: Date) => string",
          description: "Custom date formatting function for upcoming runs.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Whether the input is disabled.",
        },
        {
          name: "readOnly",
          type: "boolean",
          default: "false",
          description: "Whether the input is read-only.",
        },
        {
          name: "inputProps",
          type: 'Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "disabled" | "readOnly">',
          description:
            "Additional props passed directly to the inner input element.",
        },
      ],
      rest: "<div>",
    },
    {
      name: "parseCron",
      signature:
        "parseCron(expression: string | undefined | null): ParseCronResult",
      description:
        "Pure logic helper in @/lib/cron-input that parses, validates, and expands a standard 5-field cron expression.",
    },
    {
      name: "describeCron",
      signature: "describeCron(expression: string | undefined | null): string",
      description:
        "Pure logic helper in @/lib/cron-input that turns a 5-field cron expression into a plain-English sentence.",
    },
    {
      name: "getNextRunTimes",
      signature:
        "getNextRunTimes(expression: string | undefined | null, count?: number, from?: Date): Date[]",
      description:
        "Pure logic helper in @/lib/cron-input that computes the next N run times starting from a reference date, following POSIX matching rules.",
    },
  ],
  "csv-importer": [
    {
      name: "CsvImporter",
      description:
        "Multi-step CSV import wizard with file upload, column mapping, data validation with inline cell fixing, and import confirmation.",
      rest: "<div>",
      props: [
        {
          name: "fields",
          type: "CsvField[]",
          required: true,
          description:
            "Target application field definitions with id, label, required flag, description, validate function, and transform function.",
        },
        {
          name: "onComplete",
          type: "(rows: Record<string, unknown>[]) => void",
          required: true,
          description:
            "Called when import is confirmed with clean, validated, and transformed row objects.",
        },
        {
          name: "onCancel",
          type: "() => void",
          description:
            "Called when the user resets or cancels the import process.",
        },
        {
          name: "maxRows",
          type: "number",
          default: "10000",
          description:
            "Maximum number of data rows to parse on the main thread.",
        },
        {
          name: "maxFileSize",
          type: "number",
          default: "10485760",
          description: "Maximum file size in bytes (defaults to 10 MB).",
        },
        {
          name: "sampleRowsCount",
          type: "number",
          default: "3",
          description:
            "Number of sample row values to preview in the column mapping step.",
        },
        {
          name: "autoMap",
          type: "boolean",
          default: "true",
          description:
            "Whether to automatically suggest column mappings matching CSV headers against field ids and labels.",
        },
        {
          name: "step",
          type: "number",
          description: "Controlled active step index (0 to 3).",
        },
        {
          name: "defaultStep",
          type: "number",
          default: "0",
          description: "Initial active step index when uncontrolled.",
        },
        {
          name: "onStepChange",
          type: "(step: number) => void",
          description: "Called when the active step index changes.",
        },
        {
          name: "defaultFile",
          type: "File",
          description:
            "Optional initial File object to automatically parse upon mount.",
        },
      ],
    },
  ],
  "date-time-range": [
    {
      name: "DateTimeRangePicker",
      description:
        "A popover with presets, a field for typed ranges, a range calendar and start and end TimeFields. Times default to 09:00 and 17:00 and show the local time zone. Open with Enter or Space, Shift+Tab from the calendar to the typed field and press Enter to apply what you typed, move between days with the arrow keys, press Enter on the first and last day, Tab to the times, and close with Escape. With the default two months, opening takes about 30 ms and each arrow key about 20 ms of render time (Chrome, Apple M4, production build). Every visible day re-renders on each key, so cost grows with numberOfMonths: at 12 months, opening takes about 220 ms and an arrow key about 40 ms. 1,000 presets add about 20 ms to opening and 10 ms to picking a day.",
      rest: "<button>",
      props: [
        STATE_PROPS.value("{ from?: Date; to?: Date }", "range"),
        STATE_PROPS.defaultValue("{ from?: Date; to?: Date }", "{}"),
        STATE_PROPS.onValueChange(
          "(range: { from?: Date; to?: Date }) => void",
          "when a day, time, preset or typed range changes, or the range is cleared"
        ),
        {
          name: "presets",
          type: "{ label: string; value: { from?: Date; to?: Date } }[]",
          default: "[]",
          description:
            "Ranges listed beside the calendar. Picking one sets the range and shows its month. A preset outside min or max, or with its end before its start, is disabled. The one matching the current range is pressed.",
        },
        {
          name: "min",
          type: "Date",
          description:
            "Earliest allowed start. Days before it are disabled, and a time before it on its day is raised to it.",
        },
        {
          name: "max",
          type: "Date",
          description:
            "Latest allowed end. Days after it are disabled, and a time after it on its day is lowered to it.",
        },
        {
          name: "locale",
          type: "string",
          description:
            "Locale for the trigger label, the time zone name and the 12 or 24 hour clock.",
        },
        {
          name: "parse",
          type: "(text: string, now: Date) => { from?: Date; to?: Date } | null",
          default: "parseRangeText",
          description:
            'Reads the typed field. The built-in parser handles English like "last 7 days", "next fri 3pm" and "yesterday to now". Return null for text you can\'t read. A range that overlaps min or max is clamped to them, while one entirely outside them, or one ending before it starts, is rejected.',
        },
        {
          name: "placeholder",
          type: "string",
          default: '"Pick a date range"',
          description: "Trigger text while no range is set.",
        },
        {
          name: "numberOfMonths",
          type: "number",
          default: "2",
          description: "Months shown side by side.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables the trigger.",
        },
        {
          name: "className",
          type: "string",
          description: "Classes for the trigger.",
        },
      ],
    },
  ],
  "description-list": [
    {
      name: "DescriptionList",
      description: "A two column <dl> grid for DescriptionItem rows.",
      rest: "<dl>",
    },
    {
      name: "DescriptionItem",
      description:
        "One label and value row. The value is the children, so editable rows take a string and the parent stores the edits.",
      props: [
        {
          name: "label",
          type: "ReactNode",
          required: true,
          description:
            "The term. A string label also names the copy and edit buttons.",
        },
        {
          name: "copyable",
          type: "boolean",
          description: "Adds a button that copies the value text.",
        },
        {
          name: "editable",
          type: "boolean",
          description: "Edits the string children in place with InlineEdit.",
        },
        {
          name: "onValueChange",
          type: "(value: string) => void | Promise<void>",
          description:
            "Called with the edited text. A pending promise keeps the field read-only and a rejection keeps it open.",
        },
        {
          name: "placeholder",
          type: "string",
          description: "Shown by an editable row while its value is empty.",
        },
      ],
      rest: "<div>",
    },
  ],
  dialog: [
    {
      name: "Dialog",
      description:
        "Same API as the shadcn/ui Dialog. Skip it if the project already has one. The root takes open, defaultOpen and onOpenChange. Compose DialogTrigger and DialogContent inside it.",
      rest: "Dialog root",
    },
    {
      name: "DialogTrigger, DialogClose",
      description:
        "Buttons that open and close the dialog. Radix uses asChild to render your own Button, and Base UI uses the render prop.",
      rest: "Dialog trigger or close",
    },
    {
      name: "DialogContent",
      description:
        "The panel, portaled above an overlay. Focus is trapped inside it, and Escape closes it.",
      props: [
        {
          name: "showCloseButton",
          type: "boolean",
          default: "true",
          description: "Show the X button in the corner.",
        },
      ],
      rest: "Dialog content",
    },
    {
      name: "DialogHeader, DialogFooter",
      description: "Layout for the title block and the action row.",
      rest: "<div>",
    },
    {
      name: "DialogTitle, DialogDescription",
      description:
        "Named by screen readers when the dialog opens. Always include a title.",
      rest: "Dialog title or description",
    },
  ],
  "diff-viewer": [
    {
      name: "DiffViewer",
      description:
        "A line diff of two strings with word-level highlights inside replaced lines. Unchanged runs collapse behind a button that expands them in place.",
      props: [
        {
          name: "oldValue",
          type: "string",
          required: true,
          description: "The text before the change.",
        },
        {
          name: "newValue",
          type: "string",
          required: true,
          description: "The text after the change.",
        },
        {
          name: "mode",
          type: '"split" | "unified"',
          default: '"split"',
          description: "Two columns side by side, or one column.",
        },
        {
          name: "contextLines",
          type: "number",
          default: "3",
          description: "Unchanged lines kept visible next to each change.",
        },
        {
          name: "ignoreWhitespace",
          type: "boolean",
          default: "false",
          description:
            "Treat lines that differ only in whitespace as unchanged, like git diff -w.",
        },
        {
          name: "renderLine",
          type: "(line: DiffLine) => ReactNode",
          description:
            "Renders the line text, for example with a syntax highlighter. Defaults to the text with word highlights.",
        },
        {
          name: "renderGutter",
          type: "(line: DiffLine) => ReactNode",
          description:
            "Adds a cell before each line number for line actions such as comments.",
        },
      ],
      rest: "<div>",
    },
  ],
  "duration-input": [
    {
      name: "DurationInput",
      description:
        "Segmented duration input with typed shorthand and unit navigation. The root has role=group, so pass aria-label or aria-labelledby.",
      props: [
        STATE_PROPS.value("number | null", "duration in milliseconds"),
        STATE_PROPS.defaultValue("number | null", "null"),
        STATE_PROPS.onValueChange(
          "(value: number | null) => void",
          "with the duration in milliseconds, or null when cleared"
        ),
        {
          name: "units",
          type: '("w" | "d" | "h" | "m" | "s" | "ms")[]',
          default: '["h", "m", "s"]',
          description: "Visible duration segments.",
        },
        {
          name: "min",
          type: "number",
          default: "0",
          description: "Minimum duration in milliseconds.",
        },
        {
          name: "max",
          type: "number",
          description: "Maximum duration in milliseconds.",
        },
        {
          name: "step",
          type: "number",
          default: "1",
          description: "Amount arrow keys step the focused segment by.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables interaction across every segment.",
        },
        {
          name: "name",
          type: "string",
          description: "Submits the milliseconds value through a hidden input.",
        },
      ],
      rest: "<div>",
    },
  ],
  "emoji-picker": [
    {
      name: "EmojiPicker",
      description:
        "An inline emoji panel with search, categories, skin tones and recently used emoji. Data loads on first mount, and recents and the skin tone persist in localStorage.",
      props: [
        {
          name: "onSelect",
          type: "(emoji: string) => void",
          description: "Called with the chosen emoji, skin tone applied.",
        },
        {
          name: "skinTone",
          type: "0 | 1 | 2 | 3 | 4 | 5",
          description: "Controlled skin tone. 0 is the default yellow.",
        },
        {
          name: "defaultSkinTone",
          type: "0 | 1 | 2 | 3 | 4 | 5",
          default: "0",
          description: "Tone to use until the user picks one.",
        },
        {
          name: "onSkinToneChange",
          type: "(skinTone: 0 | 1 | 2 | 3 | 4 | 5) => void",
          description: "Called when the user picks a skin tone.",
        },
      ],
      rest: "<div>",
    },
  ],
  "file-dropzone": [
    {
      name: "FileDropzone",
      description:
        "Validates dropped or picked files and reports them. It does not upload or store anything, so keep the list in your own state.",
      props: [
        {
          name: "accept",
          type: "string",
          description:
            "Comma separated extensions, MIME types or wildcards such as image/*.",
        },
        {
          name: "maxSize",
          type: "number",
          description: "Largest file in bytes.",
        },
        {
          name: "maxFiles",
          type: "number",
          description: "Most files accepted from one drop or pick.",
        },
        {
          name: "multiple",
          type: "boolean",
          default: "true",
          description: "Allow more than one file at a time.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Ignore drops and clicks.",
        },
        {
          name: "onFilesAccepted",
          type: "(files: File[]) => void",
          description: "Called with the files that passed validation.",
        },
        {
          name: "onFilesRejected",
          type: "(rejections: FileRejection[]) => void",
          description:
            'Called with { file, reason } for each rejected file, where reason is "type", "size" or "count".',
        },
      ],
      rest: "<label>",
    },
    {
      name: "FileDropzoneItem",
      description:
        "One row of a FileDropzoneList. A progress bar shows while progress is below 100.",
      props: [
        {
          name: "name",
          type: "string",
          required: true,
          description: "File name.",
        },
        {
          name: "size",
          type: "number",
          required: true,
          description: "File size in bytes.",
        },
        {
          name: "progress",
          type: "number",
          description: "Upload progress from 0 to 100.",
        },
        {
          name: "error",
          type: "string",
          description: "Marks the row invalid and shows the message.",
        },
        {
          name: "onRemove",
          type: "() => void",
          description: "Shows a remove button that calls it.",
        },
      ],
      rest: "<li>",
    },
  ],
  "filter-builder": [
    {
      name: "FilterBuilder",
      description:
        "A row of filter chips with AND/OR groups, date fields, and multi-select. Scale limit: up to 2 nested levels and 20 filters recommended in UI.",
      props: [
        {
          name: "fields",
          type: "FilterField[]",
          required: true,
          description:
            'Filterable fields: { id, label, type: "text" | "number" | "select" | "date", options?, icon? }.',
        },
        STATE_PROPS.value("Filter[] | FilterGroup", "filters"),
        STATE_PROPS.defaultValue("Filter[] | FilterGroup", "[]"),
        STATE_PROPS.onValueChange(
          "(filters: Filter[] | FilterGroup) => void",
          "when a filter is added, changed or removed"
        ),
        {
          name: "allowGroups",
          type: "boolean",
          default: "true",
          description: "Whether users can create nested AND/OR groups.",
        },
        {
          name: "aria-label",
          type: "string",
          default: '"Filters"',
          description: "Name of the filter group.",
        },
      ],
      rest: "<div>",
    },
    {
      name: "matchesFilter",
      signature: "matchesFilter(fieldValue: unknown, filter: Filter): boolean",
      description:
        "Import from @/lib/filter to apply a Filter to your rows. Supports text, number, select (including is-any-of and is-none-of), and date fields (before, after, between).",
    },
    {
      name: "matchesFilterGroup",
      signature:
        "matchesFilterGroup(item: Record<string, unknown>, group: FilterGroup): boolean",
      description:
        "Evaluates a nested FilterGroup with 'and' / 'or' conjunctions against a record.",
    },
    {
      name: "matchesFilters",
      signature:
        "matchesFilters(item: Record<string, unknown>, filters: Filter[] | FilterGroup): boolean",
      description:
        "Universal evaluator helper accepting either a flat Filter[] or a FilterGroup.",
    },
    {
      name: "serializeFilters",
      signature: "serializeFilters(filters: Filter[] | FilterGroup): string",
      description:
        "Serializes filters or groups into a compact, human-readable, URL-safe string.",
    },
    {
      name: "parseFilters",
      signature:
        "parseFilters(query: string, options?: { asGroup?: boolean }): Filter[] | FilterGroup",
      description:
        "Parses a DSL string, URL search parameters, or JSON into Filter[] or FilterGroup.",
    },
  ],
  "histogram-range": [
    {
      name: "HistogramRange",
      description:
        "A dual-thumb range slider sitting below a distribution histogram bar chart. Highlights values in the selected range and mutes values outside.",
      props: [
        {
          name: "data",
          type: "number[]",
          description:
            "Raw numeric dataset to distribute across histogram bins.",
        },
        {
          name: "min",
          type: "number",
          description:
            "Lower bound of the range. Defaults to min value in data, or 0.",
        },
        {
          name: "max",
          type: "number",
          description:
            "Upper bound of the range. Defaults to max value in data, or 100.",
        },
        {
          name: "step",
          type: "number",
          default: "1",
          description: "Step increment of the slider thumbs.",
        },
        {
          name: "minStepsBetweenThumbs",
          type: "number",
          default: "0",
          description:
            "Minimum number of steps required between the two thumbs.",
        },
        STATE_PROPS.value("[number, number]", "selected range"),
        STATE_PROPS.defaultValue("[number, number]", "[min, max]"),
        STATE_PROPS.onValueChange(
          "(value: [number, number]) => void",
          "when the range changes during dragging or keyboard input"
        ),
        {
          name: "onValueCommit",
          type: "(value: [number, number]) => void",
          description:
            "Called when pointer drag or keyboard interaction finishes.",
        },
        {
          name: "bins",
          type: "number",
          default: "24",
          description: "Number of discrete histogram buckets.",
        },
        {
          name: "formatValue",
          type: "(value: number) => string",
          description: "Formats values for display and thumb aria-valuetext.",
        },
        {
          name: "minThumbLabel",
          type: "string",
          default: '"Minimum"',
          description: "Accessible aria-label for the lower thumb.",
        },
        {
          name: "maxThumbLabel",
          type: "string",
          default: '"Maximum"',
          description: "Accessible aria-label for the upper thumb.",
        },
        {
          name: "showValues",
          type: "boolean",
          default: "false",
          description:
            "Whether to render current range values above the chart.",
        },
        {
          name: "showCount",
          type: "boolean",
          default: "false",
          description: "Whether to render active item count above the chart.",
        },
        {
          name: "renderCount",
          type: "(selectedCount: number, totalCount: number) => React.ReactNode",
          description:
            "Custom renderer for result count summary and live region.",
        },
        {
          name: "barHeight",
          type: "number | string",
          default: "64",
          description: "Height of the histogram chart area.",
        },
        {
          name: "barColor",
          type: "string",
          description:
            "Tailwind class for active bars inside the range (defaults to bg-primary).",
        },
        {
          name: "mutedBarColor",
          type: "string",
          description:
            "Tailwind class for inactive bars outside the range (defaults to bg-muted-foreground/20).",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Whether the slider thumbs are disabled.",
        },
      ],
      rest: "<div>",
    },
    {
      name: "buildHistogramBuckets",
      signature:
        "buildHistogramBuckets(options: BuildHistogramBucketsOptions): BuildHistogramBucketsResult",
      description:
        "Pure logic helper in @/lib/histogram-range that buckets numeric data, normalizes bar heights, and calculates inRange statuses.",
    },
  ],
  "image-cropper": [
    {
      name: "ImageCropper",
      description:
        "An image cropping widget supporting pan, zoom, rotation, fixed aspect ratios, and Blob export.",
      props: [
        {
          name: "src",
          type: "string | File | Blob",
          required: true,
          description: "Source image URL, File, or Blob.",
        },
        {
          name: "aspect",
          type: "number | null",
          default: "1",
          description:
            "Aspect ratio (width / height) such as 1 (square), 16/9 (widescreen), or 4/3 (photo).",
        },
        {
          name: "cropShape",
          type: '"rect" | "round"',
          default: '"rect"',
          description:
            "Visual mask overlay shape. round displays a circular mask for avatars.",
        },
        {
          name: "zoom",
          type: "number",
          description: "Controlled zoom scale.",
        },
        {
          name: "defaultZoom",
          type: "number",
          default: "1",
          description: "Initial zoom scale when uncontrolled.",
        },
        {
          name: "onZoomChange",
          type: "(zoom: number) => void",
          description: "Called when zoom scale changes.",
        },
        {
          name: "minZoom",
          type: "number",
          default: "1",
          description: "Minimum zoom scale.",
        },
        {
          name: "maxZoom",
          type: "number",
          default: "3",
          description: "Maximum zoom scale.",
        },
        {
          name: "rotation",
          type: "number",
          description: "Controlled rotation angle in degrees.",
        },
        {
          name: "defaultRotation",
          type: "number",
          default: "0",
          description: "Initial rotation angle in degrees.",
        },
        {
          name: "onRotationChange",
          type: "(rotation: number) => void",
          description: "Called when rotation angle changes.",
        },
        {
          name: "crop",
          type: "Point",
          description: "Controlled pan offset { x, y } in pixels.",
        },
        {
          name: "defaultCrop",
          type: "Point",
          default: "{ x: 0, y: 0 }",
          description: "Initial pan offset.",
        },
        {
          name: "onCropChange",
          type: "(crop: Point) => void",
          description: "Called when pan offset changes.",
        },
        {
          name: "onCropComplete",
          type: "(blob: Blob, pixelCrop: PixelCrop) => void",
          description:
            "Called with the cropped image Blob and natural pixel crop dimensions when Apply is clicked or Enter is pressed.",
        },
        {
          name: "onCropError",
          type: "(error: Error) => void",
          description: "Called when image loading or canvas export fails.",
        },
        {
          name: "outputType",
          type: '"image/png" | "image/jpeg" | "image/webp"',
          default: '"image/png"',
          description: "MIME type for the generated Blob.",
        },
        {
          name: "outputQuality",
          type: "number",
          default: "0.92",
          description: "Quality setting (0 to 1) for lossy formats.",
        },
        {
          name: "showControls",
          type: "boolean",
          default: "true",
          description: "Show zoom slider and rotate buttons below canvas.",
        },
        {
          name: "showGrid",
          type: "boolean",
          default: "true",
          description: "Show rule-of-thirds grid inside crop area.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables pan, zoom, and rotate interactions.",
        },
      ],
      rest: "<div>",
    },
  ],
  "inline-edit": [
    {
      name: "InlineEdit",
      description:
        "Text that turns into an input on click. Enter or blur saves and Escape cancels. Pass aria-label to describe the field.",
      props: [
        {
          name: "value",
          type: "string",
          required: true,
          description: "The saved text.",
        },
        {
          name: "onSave",
          type: "(value: string) => void | Promise<void>",
          required: true,
          description:
            "Called with the edited text. While a returned promise is pending the field is read-only, and a rejection marks it invalid and keeps it open.",
        },
        {
          name: "placeholder",
          type: "string",
          default: '"Empty"',
          description: "Text shown while value is empty.",
        },
        { name: "disabled", type: "boolean", description: "Prevents editing." },
      ],
      rest: "<div>",
    },
  ],
  input: [
    {
      name: "Input",
      description:
        "Same API as the shadcn/ui Input. Skip it if the project already has one. It has no props of its own. Pair it with Label, and set aria-invalid for the destructive border.",
      rest: "<input>",
    },
  ],
  "json-viewer": [
    {
      name: "JsonViewer",
      description:
        "A searchable JSON tree on top of TreeView with optional row virtualization for large datasets. Supports wildcard path filtering (e.g. users[*].email), truncated multi-line and long strings with inline expand/collapse, deferred search typing, and copy value or path via hover buttons, Ctrl or Cmd+C, and Shift+Ctrl or Cmd+C. Arrays over 100 items open as groups of 100.",
      props: [
        {
          name: "data",
          type: "unknown",
          required: true,
          description: "Any JSON value.",
        },
        {
          name: "defaultExpandDepth",
          type: "number",
          default: "1",
          description: "How many levels start open.",
        },
        {
          name: "defaultPathFilter",
          type: "string",
          description:
            "Initial path filter pattern e.g. users[*].email or *.id.",
        },
        {
          name: "maxStringLength",
          type: "number",
          default: "80",
          description:
            "Length threshold for truncating single-line strings with an inline Show more button. Strings containing newlines are always truncated to their first line regardless of length.",
        },
        {
          name: "onCopy",
          type: '(path: string, value: unknown, target: "value" | "path") => void',
          description: "Called after a value or path is copied.",
        },
        {
          name: "onPathFilterChange",
          type: "(path: string) => void",
          description: "Called when the path filter pattern changes.",
        },
        {
          name: "pathFilter",
          type: "string",
          description:
            "Controlled path filter pattern e.g. users[*].email or *.id.",
        },
        {
          name: "virtual",
          type: "boolean",
          default: "false",
          description:
            "Whether to virtualize row rendering via TreeView for large datasets.",
        },
      ],
      rest: "<div>",
    },
  ],
  "key-value-editor": [
    {
      name: "KeyValueEditor",
      description:
        "Editable rows of key and value. Pasting KEY=value text into a key splits it into rows, and duplicate keys are flagged.",
      props: [
        STATE_PROPS.value("KeyValueRow[]", "rows of { id, key, value }"),
        STATE_PROPS.defaultValue("KeyValueRow[]", "[]"),
        STATE_PROPS.onValueChange(
          "(rows: KeyValueRow[]) => void",
          "with the new rows after any edit, paste, add or remove"
        ),
        {
          name: "secretValues",
          type: "boolean",
          default: "false",
          description:
            "Mask every value with a password input that has its own reveal button.",
        },
        {
          name: "keyLabel",
          type: "string",
          default: '"Key"',
          description:
            "Column heading and the start of each key input's label.",
        },
        {
          name: "valueLabel",
          type: "string",
          default: '"Value"',
          description:
            "Column heading and the start of each value input's label.",
        },
        {
          name: "keyPlaceholder",
          type: "string",
          default: '"KEY"',
          description: "Placeholder for key inputs.",
        },
        {
          name: "valuePlaceholder",
          type: "string",
          default: '"Value"',
          description: "Placeholder for value inputs.",
        },
        {
          name: "addLabel",
          type: "string",
          default: '"Add row"',
          description: "Text of the add button.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disable every input and button.",
        },
      ],
      rest: "<div>",
    },
  ],
  label: [
    {
      name: "Label",
      description:
        "Same API as the shadcn/ui Label. Skip it if the project already has one. Point htmlFor at a field id. It dims when the field inside its group is disabled.",
      rest: "<label>",
    },
  ],
  "log-viewer": [
    {
      name: "LogViewer",
      description:
        "High-throughput virtualized log viewer with ANSI color parsing, search, level filtering, and tail auto-scroll.",
      props: [
        {
          name: "defaultFollow",
          type: "boolean",
          default: "true",
          description: "Initial follow state when uncontrolled.",
        },
        {
          name: "defaultLevel",
          type: "string",
          default: '"all"',
          description: "Initial level filter when uncontrolled.",
        },
        {
          name: "defaultSearch",
          type: "string",
          default: '""',
          description: "Initial search query when uncontrolled.",
        },
        {
          name: "defaultWrap",
          type: "boolean",
          default: "false",
          description: "Initial line wrap state when uncontrolled.",
        },
        {
          name: "emptyMessage",
          type: "ReactNode",
          default: '"No log lines matching criteria"',
          description:
            "Message or element displayed when no logs match filters.",
        },
        {
          name: "filterable",
          type: "boolean",
          default: "true",
          description:
            "Whether to render log level filter buttons in the toolbar.",
        },
        {
          name: "follow",
          type: "boolean",
          description: "Controlled tail auto-scroll state.",
        },
        {
          name: "height",
          type: "number | string",
          default: "400",
          description: "Height of the virtualized log list viewport.",
        },
        {
          name: "level",
          type: "string",
          description: "Controlled level filter.",
        },
        {
          name: "lines",
          type: "LogLine[]",
          required: true,
          description: "Array of log entries to display.",
        },
        {
          name: "onFollowChange",
          type: "(follow: boolean) => void",
          description: "Called when follow state changes.",
        },
        {
          name: "onLevelChange",
          type: "(level: string) => void",
          description: "Called when level filter changes.",
        },
        {
          name: "onSearchChange",
          type: "(search: string) => void",
          description: "Called when search query changes.",
        },
        {
          name: "onWrapChange",
          type: "(wrap: boolean) => void",
          description: "Called when line wrap is toggled.",
        },
        {
          name: "rowHeight",
          type: "number",
          default: "24",
          description: "Estimated line height in pixels for the virtual list.",
        },
        {
          name: "search",
          type: "string",
          description: "Controlled search query.",
        },
        {
          name: "searchable",
          type: "boolean",
          default: "true",
          description:
            "Whether to render the search filter input in the toolbar.",
        },
        {
          name: "showLineNumbers",
          type: "boolean",
          default: "true",
          description: "Whether to display line numbers in the gutter.",
        },
        {
          name: "showTimestamps",
          type: "boolean",
          default: "true",
          description:
            "Whether to display timestamps if present in the log line.",
        },
        {
          name: "wrap",
          type: "boolean",
          description:
            "Controlled line wrap. When false, long messages scroll sideways in one shared viewport; when true, they wrap onto extra lines.",
        },
      ],
      rest: "<div>",
    },
  ],
  "masked-input": [
    {
      name: "MaskedInput",
      description:
        "Input that formats typed characters according to a mask pattern while storing the raw unmasked value.",
      props: [
        {
          name: "mask",
          type: "string",
          required: true,
          description:
            "Mask pattern where # matches digits, a or A matches letters, and * matches alphanumeric characters.",
        },
        {
          name: "definitions",
          type: "Record<string, RegExp>",
          description:
            "Custom character token definitions mapping token character to matching RegExp pattern.",
        },
        STATE_PROPS.value("string", "unmasked raw string"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string, formattedValue: string) => void",
          "with the unmasked and formatted values"
        ),
        {
          name: "name",
          type: "string",
          description: "Submits the raw unmasked string via a hidden input.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables the input.",
        },
      ],
      rest: "<input>",
    },
    {
      name: "CurrencyInput",
      description:
        "Input that formats monetary amounts according to currency and locale while storing integer cents.",
      props: [
        {
          name: "currency",
          type: "string",
          default: '"USD"',
          description: "ISO 4217 currency code (e.g. USD, EUR, JPY, GBP).",
        },
        {
          name: "locale",
          type: "string",
          default: '"en-US"',
          description:
            "BCP 47 language tag for number and currency formatting.",
        },
        STATE_PROPS.value("number | null", "amount in integer cents"),
        STATE_PROPS.defaultValue("number | null", "null"),
        STATE_PROPS.onValueChange(
          "(value: number | null, formattedValue: string) => void",
          "with integer cents and formatted text"
        ),
        {
          name: "min",
          type: "number",
          description: "Minimum allowed amount in cents. Enforced on blur.",
        },
        {
          name: "max",
          type: "number",
          description:
            "Maximum allowed amount in cents. Enforced during typing and on blur.",
        },
        {
          name: "name",
          type: "string",
          description: "Submits the integer cents via a hidden input.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables the input.",
        },
      ],
      rest: "<input>",
    },
  ],
  "mention-textarea": [
    {
      name: "MentionTextarea",
      description:
        "Opens a suggestion list when the caret follows a trigger character. Arrow keys move through it, Enter or Tab inserts the trigger, the option's value and a space, and Escape closes it. Inserted mentions act as one unit: Backspace or Delete next to one removes it whole and the caret cannot land inside it. Enter and Tab are ignored while an IME composition is active.",
      props: [
        STATE_PROPS.value("string", "text"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string) => void",
          "when the text changes"
        ),
        {
          name: "triggers",
          type: "Record<string, MentionOption[] | MentionSearch>",
          required: true,
          description:
            'Maps a single trigger character to its options, for example { "@": people, "#": searchChannels }. A static list is filtered on value and label; a MentionSearch is called with the query instead.',
        },
        {
          name: "searchDelay",
          type: "number",
          default: "150",
          description:
            "Milliseconds to wait after typing stops before calling a MentionSearch.",
        },
      ],
      rest: "<textarea>",
    },
    {
      name: "MentionOption",
      description: "One suggestion.",
      props: [
        {
          name: "value",
          type: "string",
          required: true,
          description:
            "Text inserted after the trigger. Typing filters on value and label.",
        },
        {
          name: "label",
          type: "string",
          required: true,
          description: "Text shown in the list.",
        },
        {
          name: "description",
          type: "string",
          description: "Second line under the label.",
        },
      ],
    },
    {
      name: "MentionSearch",
      description:
        "(query: string, { signal }: { signal: AbortSignal }) => Promise<MentionOption[]>. Pass the signal to fetch; the request is aborted when the query changes or the list closes. A rejected promise shows the error state. The first 8 results are shown.",
    },
  ],
  "multi-select": [
    {
      name: "MultiSelect",
      description:
        "A combobox whose listbox allows several selections. Typing filters, ArrowUp and ArrowDown move through the list, Enter toggles the highlighted option and Escape closes it. Backspace at the start of the field selects the last chip and a second Backspace removes it. A Select all option toggles every matching option when there is no maxSelected.",
      props: [
        {
          name: "options",
          type: "MultiSelectOption[]",
          required: true,
          description: "The values to choose from.",
        },
        STATE_PROPS.value("string[]", "list of selected values"),
        STATE_PROPS.defaultValue("string[]", "[]"),
        STATE_PROPS.onValueChange(
          "(value: string[]) => void",
          "after an option is selected or removed"
        ),
        {
          name: "maxSelected",
          type: "number",
          description:
            "Most values allowed. Unselected options are disabled once it is reached.",
        },
        {
          name: "maxVisibleChips",
          type: "number",
          description: "Chips shown before the rest collapse into a +N count.",
        },
      ],
      rest: "<input>",
    },
    {
      name: "MultiSelectOption",
      description: "One choice.",
      props: [
        {
          name: "value",
          type: "string",
          required: true,
          description: "Stored in the value array.",
        },
        {
          name: "label",
          type: "string",
          required: true,
          description: "Text shown in the list and on the chip.",
        },
        {
          name: "group",
          type: "string",
          description: "Heading the option is listed under.",
        },
      ],
    },
  ],
  "notification-inbox": [
    {
      name: "NotificationInbox",
      description:
        "A bell button that shows the unread count and opens notifications grouped by day, newest first. Up and Down arrows, Home and End move between items, and Escape closes the popover.",
      props: [
        {
          name: "items",
          type: "T[]",
          description:
            "Controlled notifications. T extends InboxNotification, so extra fields reach renderItem and actions typed.",
        },
        {
          name: "defaultItems",
          type: "T[]",
          default: "[]",
          description: "Initial notifications when uncontrolled.",
        },
        {
          name: "onItemsChange",
          type: "(items: T[]) => void",
          description:
            "Called with the full list when read state changes: an unread item is opened, an item is marked read or unread, or Mark all as read runs. Opening a read item changes nothing, so track opens with onItemClick.",
        },
        {
          name: "onMarkRead",
          type: "(ids: string[]) => void",
          description:
            "Called when an unread item is opened or its Mark as read button is pressed.",
        },
        {
          name: "onMarkUnread",
          type: "(ids: string[]) => void",
          description: "Called when Mark as unread is pressed on a read item.",
        },
        {
          name: "onMarkAllRead",
          type: "() => void",
          description:
            "Called by Mark all as read. onMarkRead is not called for it.",
        },
        {
          name: "onItemClick",
          type: "(notification: T) => void",
          description:
            "Called when an item is opened, after it is marked read. The popover then closes.",
        },
        {
          name: "actions",
          type: "NotificationAction<T>[]",
          default: "[]",
          description:
            "Extra icon buttons on each row, each { label, icon, onSelect(notification) }. If onSelect removes the item, focus moves to the next item.",
        },
        {
          name: "renderItem",
          type: "(notification: T) => ReactNode",
          description:
            "Replaces the content of each row. It renders inside the row's button or link, so it must not contain interactive elements. Defaults to NotificationItem.",
        },
        {
          name: "open",
          type: "boolean",
          description: "Controlled open state of the popover.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "false",
          description: "Initial open state when uncontrolled.",
        },
        {
          name: "onOpenChange",
          type: "(open: boolean) => void",
          description: "Called when the popover opens or closes.",
        },
        {
          name: "now",
          type: "Date",
          description:
            "Reference time for the Today and Yesterday headings. Defaults to the current time when the popover renders.",
        },
        {
          name: "locale",
          type: "string",
          description:
            "Locale for day headings and times. Defaults to the browser locale.",
        },
        {
          name: "aria-label",
          type: "string",
          default: '"Notifications"',
          description:
            "Panel heading and the trigger's accessible name, which adds the unread count.",
        },
      ],
      rest: "<button> (the trigger)",
    },
    {
      name: "InboxNotification",
      description: "One notification.",
      props: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Unique id.",
        },
        {
          name: "title",
          type: "string",
          required: true,
          description:
            "Main line. Also names the row's action buttons for screen readers.",
        },
        {
          name: "body",
          type: "string",
          description: "Secondary text, clamped to two lines.",
        },
        {
          name: "createdAt",
          type: "Date | string",
          required: true,
          description:
            "Any value new Date() accepts. Sets the day group and the time. Items with an invalid date go last under Earlier.",
        },
        {
          name: "read",
          type: "boolean",
          default: "false",
          description: "Unread items show a dot and count toward the badge.",
        },
        {
          name: "href",
          type: "string",
          description: "Renders the row as a link instead of a button.",
        },
        {
          name: "actor",
          type: "{ name: string; avatarUrl?: string }",
          description:
            "Shows an avatar, with initials when there is no avatarUrl or it fails to load.",
        },
      ],
    },
    {
      name: "NotificationItem",
      description:
        "The default row content: avatar, title, body and time. Takes the InboxNotification fields, so <NotificationItem {...notification} /> works inside renderItem.",
      props: [
        {
          name: "locale",
          type: "string",
          description: "Locale for the time.",
        },
        {
          name: "className",
          type: "string",
          description: "Classes for the content wrapper.",
        },
      ],
    },
  ],
  "number-input": [
    {
      name: "NumberInput",
      description:
        "Arrow keys step by step, Shift+Arrow and PageUp/PageDown by ten steps, and Home/End jump to min and max. Typed text is parsed with the locale's separators.",
      props: [
        STATE_PROPS.value("number | null", "number, or null when empty"),
        STATE_PROPS.defaultValue("number | null", "null"),
        STATE_PROPS.onValueChange(
          "(value: number | null) => void",
          "when the parsed number changes"
        ),
        { name: "min", type: "number", description: "Lowest allowed value." },
        { name: "max", type: "number", description: "Highest allowed value." },
        {
          name: "step",
          type: "number",
          default: "1",
          description: "Amount the arrow keys add or subtract.",
        },
        {
          name: "locale",
          type: "string",
          description:
            "Locale for formatting and parsing. Defaults to the browser's.",
        },
        {
          name: "formatOptions",
          type: "Intl.NumberFormatOptions",
          description: "Display format, for example a currency.",
        },
        {
          name: "name",
          type: "string",
          description: "Submits the raw number through a hidden input.",
        },
      ],
      rest: "<input>",
    },
  ],
  "onboarding-checklist": [
    {
      name: "OnboardingChecklist",
      description:
        "Dashboard setup guide with a list of tasks, accessible checkboxes, action buttons, and a progress bar.",
      props: [
        {
          name: "items",
          type: "OnboardingChecklistItem[]",
          required: true,
          description: "List of checklist tasks to display.",
        },
        {
          name: "title",
          type: "ReactNode",
          default: '"Getting started"',
          description: "Card header title.",
        },
        {
          name: "description",
          type: "ReactNode",
          description: "Card header description text.",
        },
        {
          name: "completed",
          type: "string[]",
          description: "Controlled array of completed task IDs.",
        },
        {
          name: "defaultCompleted",
          type: "string[]",
          default: "[]",
          description: "Initial completed task IDs when uncontrolled.",
        },
        {
          name: "onCompletedChange",
          type: "(completed: string[]) => void",
          description: "Called when any task is checked or unchecked.",
        },
        {
          name: "onItemToggle",
          type: "(item: OnboardingChecklistItem, completed: boolean) => void",
          description: "Called with the toggled item and its new state.",
        },
        {
          name: "collapsible",
          type: "boolean",
          default: "false",
          description:
            "Whether the checklist can be collapsed down to header and progress.",
        },
        {
          name: "open",
          type: "boolean",
          description: "Controlled open state when collapsible.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "true",
          description: "Initial open state when collapsible and uncontrolled.",
        },
        {
          name: "onOpenChange",
          type: "(open: boolean) => void",
          description: "Called when collapsible open state toggles.",
        },
        {
          name: "progressFormat",
          type: "(progress: OnboardingChecklistProgress) => ReactNode",
          description: "Custom formatter for the progress ratio indicator.",
        },
      ],
      rest: "Card root",
    },
    {
      name: "OnboardingChecklistItem",
      description: "Individual task item definition.",
      props: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Unique identifier for tracking completion.",
        },
        {
          name: "title",
          type: "string",
          required: true,
          description: "Task title text.",
        },
        {
          name: "description",
          type: "ReactNode",
          description: "Optional supplementary details.",
        },
        {
          name: "action",
          type: "OnboardingChecklistAction",
          description: "Action button or link for completing the step.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables toggling this item.",
        },
      ],
    },
    {
      name: "OnboardingChecklistAction",
      description: "Action button or link configuration for a task.",
      props: [
        {
          name: "label",
          type: "string",
          required: true,
          description: "Button or link text.",
        },
        {
          name: "onClick",
          type: "(event: MouseEvent<HTMLButtonElement>) => void",
          description: "Click handler rendering a Button.",
        },
        {
          name: "href",
          type: "string",
          description: "URL rendering a styled anchor link.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the action control.",
        },
      ],
    },
  ],
  "password-input": [
    {
      name: "PasswordInput",
      description:
        "A password field with a button that shows and hides the value. It has no props of its own.",
      rest: "<input>, except type",
    },
    {
      name: "PasswordStrength",
      description:
        "A four segment meter with a polite live region that announces the label.",
      props: [
        {
          name: "value",
          type: "string",
          required: true,
          description: "The password to score.",
        },
        {
          name: "getScore",
          type: "(value: string) => 0 | 1 | 2 | 3 | 4",
          default: "scorePassword",
          description: "Replaces the built-in scoring.",
        },
        {
          name: "labels",
          type: "[string, string, string, string, string]",
          default: '["Too weak", "Weak", "Fair", "Good", "Strong"]',
          description: "Label for each score from 0 to 4.",
        },
      ],
      rest: "<div>",
    },
  ],
  "permission-matrix": [
    {
      name: "PermissionMatrix",
      description:
        "A role and access management matrix that maps roles against grouped permissions. Supports tri-state group toggles, recursive role inheritance, sticky headers, and 2D WAI-ARIA grid keyboard navigation.",
      props: [
        {
          name: "allowOverrideInherited",
          type: "boolean",
          default: "true",
          description:
            "Whether inherited permissions can be directly toggled or overridden.",
        },
        {
          name: "defaultExpandedGroups",
          type: "string[]",
          description: "IDs of permission groups expanded by default.",
        },
        STATE_PROPS.defaultValue("PermissionGrants", "{}"),
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables interaction across the entire matrix.",
        },
        {
          name: "expandedGroups",
          type: "string[]",
          description:
            "Controlled array of permission group IDs that are expanded.",
        },
        {
          name: "onExpandedGroupsChange",
          type: "(groups: string[]) => void",
          description: "Callback fired when group expansion state changes.",
        },
        STATE_PROPS.onValueChange(
          "(value: PermissionGrants) => void",
          "when any grant in the matrix is updated"
        ),
        {
          name: "permissions",
          type: "PermissionGroup[]",
          required: true,
          description:
            "Groups of permission actions displayed in the matrix rows.",
        },
        {
          name: "readOnly",
          type: "boolean",
          default: "false",
          description:
            "Renders the matrix in read-only audit mode without interactive checkboxes.",
        },
        {
          name: "roles",
          type: "PermissionRole[]",
          required: true,
          description:
            "Roles displayed across matrix columns, with optional inheritsFrom inheritance.",
        },
        {
          name: "searchPlaceholder",
          type: "string",
          default: '"Filter permissions..."',
          description: "Placeholder text for the search filter input.",
        },
        {
          name: "searchable",
          type: "boolean",
          default: "true",
          description:
            "Whether to show the search input above the matrix to filter permissions.",
        },
        STATE_PROPS.value(
          "PermissionGrants",
          'Controlled grants mapping role ID to an array of permission IDs. A `"!permissionId"` entry explicitly denies a permission the role would otherwise inherit.'
        ),
      ],
      rest: "<div>",
    },
  ],
  "phone-input": [
    {
      name: "PhoneInput",
      description:
        "A tel input with a searchable country picker. It holds an E.164 string and shows the number without its dial code, so +917424855888 reads 74248 55888 beside a +91 button. Label it with a Label and id, or with aria-label. In the picker, arrow keys move through the list, Enter selects without submitting the form, and Escape closes it and returns focus to the country button.",
      props: [
        STATE_PROPS.value("string", "phone number in E.164 format"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string) => void",
          'on every accepted edit with the E.164 number, or "" when empty. The number is partial while typing, such as "+1415"'
        ),
        {
          name: "defaultCountry",
          type: "CountryCode",
          default: '"US"',
          description:
            "ISO 3166-1 alpha-2 country used until the value identifies one. Falls back to the first listed country when it is not in countries.",
        },
        {
          name: "countries",
          type: "PhoneCountryOption[]",
          default: "every country",
          description:
            "The countries to offer, in display order. Pass codes, or objects that rename a country or replace its flag.",
        },
        {
          name: "excludedCountries",
          type: "CountryCode[]",
          description:
            "Countries to remove. Applies on top of countries, and wins if a code is in both.",
        },
        {
          name: "name",
          type: "string",
          description:
            "Submits the E.164 value through a hidden input. The visible field has no name, so forms never receive the formatted text.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables the field and the country button.",
        },
        {
          name: "placeholder",
          type: "string",
          description: "Text shown in the field while it is empty.",
        },
        {
          name: "autoComplete",
          type: "string",
          default: '"tel"',
          description:
            "Browser autofill hint. Autofilled numbers are handled like a paste.",
        },
        {
          name: "aria-invalid",
          type: "boolean",
          description:
            "Draws the destructive border and ring around the whole field, country button included.",
        },
        {
          name: "ref",
          type: "React.Ref<HTMLInputElement>",
          description: "Points at the tel input.",
        },
        {
          name: "className",
          type: "string",
          description:
            "Goes on the outer field. Inner parts carry the data-slot values phone-input-country, phone-input-field, phone-input-search and phone-input-list.",
        },
      ],
      rest: "<input>, except type",
    },
    {
      name: "Country restrictions",
      description:
        "countries and excludedCountries limit what the field accepts as well as what the picker lists. A typed or pasted number from a country outside the list is ignored, onValueChange does not fire, and a polite live region announces it. Calling codes shared by several countries are checked on the complete number, so with US only, +1 416 can be typed until the last digit, where it is blocked as Canadian. Deleting is always allowed. A disallowed value passed through props still displays, in international format.",
    },
    {
      name: "PhoneCountryOption",
      signature: [
        "type PhoneCountryOption =",
        "  | CountryCode",
        "  | { code: CountryCode; name?: string; flag?: React.ReactNode }",
      ].join("\n"),
      description:
        "One entry in countries. Fields you leave out keep their defaults, and the dial code always comes from the code. Import the type from @/components/ui/phone-input, and CountryCode from libphonenumber-js.",
      props: [
        {
          name: "code",
          type: "CountryCode",
          required: true,
          description: 'ISO 3166-1 alpha-2 code, such as "IN".',
        },
        {
          name: "name",
          type: "string",
          description:
            "Label in the list and the country button's accessible name, and what search matches. Defaults to the English name from Intl.DisplayNames, so pass this to translate.",
        },
        {
          name: "flag",
          type: "React.ReactNode",
          description:
            "Replaces the emoji flag, hidden from assistive technology. Windows browsers show emoji flags as two letters, so pass an image or SVG if that matters to you.",
        },
      ],
    },
    {
      name: "isValidPhoneNumber",
      signature: "isValidPhoneNumber(value: string): boolean",
      description:
        "From libphonenumber-js, which this component installs. PhoneInput does not validate: value is partial while typing, so call this on submit or to set aria-invalid.",
    },
    {
      name: "formatPhoneValue",
      signature:
        "formatPhoneValue(value: string, country: CountryCode): string",
      description:
        "From @/lib/phone-input. Formats a saved E.164 number the way the field shows it, without the dial code, for read-only screens.",
    },
    {
      name: "resolveCountries",
      signature: [
        "resolveCountries(",
        "  countries?: PhoneCountryOption[],",
        "  excludedCountries?: CountryCode[]",
        "): PhoneCountry[]",
      ].join("\n"),
      description:
        "From @/lib/phone-input. Returns the list PhoneInput would show, for building your own country menu. PHONE_COUNTRIES from the same file holds every country.",
    },
    {
      name: "filterCountries",
      signature:
        "filterCountries(countries: PhoneCountry[], query: string): PhoneCountry[]",
      description:
        "From @/lib/phone-input. The picker's search: names ignoring case and accents, exact country codes, and dial code prefixes with or without the plus.",
    },
    {
      name: "PhoneCountry",
      description:
        "A resolved country, as returned by resolveCountries and PHONE_COUNTRIES.",
      props: [
        {
          name: "code",
          type: "CountryCode",
          required: true,
          description: 'ISO 3166-1 alpha-2 code, such as "IN".',
        },
        {
          name: "name",
          type: "string",
          required: true,
          description: "Display name.",
        },
        {
          name: "dialCode",
          type: "string",
          required: true,
          description: 'Calling code with its plus, such as "+91".',
        },
        {
          name: "flag",
          type: "React.ReactNode",
          required: true,
          description: "Emoji flag, or your replacement.",
        },
      ],
    },
  ],
  popover: [
    {
      name: "Popover",
      description:
        "Same API as the shadcn/ui Popover. Skip it if the project already has one. The root takes open, defaultOpen and onOpenChange.",
      rest: "Popover root",
    },
    {
      name: "PopoverTrigger",
      description:
        "Toggles the popover. Radix uses asChild to render your own Button, and Base UI uses the render prop.",
      rest: "Popover trigger",
    },
    {
      name: "PopoverContent",
      description:
        "The floating panel, portaled and flipped when there is no room. Set the width with className. side also works here.",
      props: [
        {
          name: "align",
          type: '"start" | "center" | "end"',
          default: '"center"',
          description: "Alignment against the trigger.",
        },
        {
          name: "sideOffset",
          type: "number",
          default: "4",
          description: "Gap to the trigger in pixels.",
        },
      ],
      rest: "Popover content",
    },
    {
      name: "PopoverAnchor",
      description:
        "Radix only. Positions the panel against another element. In Base UI, pass anchor to PopoverContent.",
    },
  ],
  "query-input": [
    {
      name: "QueryInput",
      description:
        "A combobox input that parses key:value terms into filters. Typing at the end of a term suggests keys, then values. Arrow keys move through the list, ArrowDown on an empty term opens it, Enter or Tab inserts the highlighted suggestion, and Escape closes. Key suggestions start with nothing highlighted, so Enter on a plain word still submits; value suggestions start on the first option.",
      props: [
        {
          name: "fields",
          type: "FilterField[]",
          required: true,
          description:
            "The keys that can be filtered on. Field ids are the keys, and select options are suggested as values.",
        },
        STATE_PROPS.value("string", "query"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string) => void",
          "when the query text changes"
        ),
        {
          name: "onFiltersChange",
          type: "(filters: Filter[], text: string) => void",
          description:
            "Called on every edit with the parsed filters and the leftover free text.",
        },
        {
          name: "className",
          type: "string",
          description:
            "Applied to the bordered wrapper, which also sets the font for the text and its highlights.",
        },
      ],
      rest: "<input>",
    },
    {
      name: "parseQuery",
      signature:
        "parseQuery(query: string, fields: FilterField[]): { filters: Filter[]; text: string }",
      description:
        "Reads a query into filters and free text. Exported from the lib file.",
    },
    {
      name: "formatQuery",
      signature: "formatQuery(filters: Filter[], text?: string): string",
      description:
        "Writes filters and free text back as a query. parseQuery reads it back to the same filters, as long as the free text has no key:value terms for known fields.",
    },
  ],
  rating: [
    {
      name: "Rating",
      description:
        "A WAI-ARIA radio group of icons. Arrow keys raise or lower the score by one step, Home and End jump to the ends, and hovering previews a score. Pass aria-label.",
      props: [
        STATE_PROPS.value("number", "score"),
        STATE_PROPS.defaultValue("number", "0"),
        STATE_PROPS.onValueChange(
          "(value: number) => void",
          "with the new score"
        ),
        {
          name: "max",
          type: "number",
          default: "5",
          description: "Number of icons.",
        },
        {
          name: "step",
          type: "1 | 0.5",
          default: "1",
          description: "0.5 lets each icon fill by half.",
        },
        {
          name: "icon",
          type: "ReactNode",
          default: "<StarIcon />",
          description:
            "SVG icon drawn for each point. Filled with the root's text color.",
        },
        {
          name: "readOnly",
          type: "boolean",
          description:
            'Shows the score without radios, as an image labelled like "3.5 out of 5".',
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Dims the rating and removes it from the tab order.",
        },
      ],
      rest: "<div>",
    },
  ],
  "recurrence-editor": [
    {
      name: "RecurrenceEditor",
      description:
        "Flagship editor for RFC 5545 recurrence rules. Supports DAILY, WEEKLY, MONTHLY, and YEARLY frequencies with INTERVAL, BYDAY, BYMONTHDAY, BYMONTH, BYSETPOS, COUNT, UNTIL, and EXDATE. Preserves unhandled calendar parts (WKST, BYHOUR, X-*) without dropping or mutating them on round-trip edits. Preserves wall-clock time invariant across daylight saving clock transitions. Scale limit: tested to parse 1,000 rules and expand 500 occurrences efficiently.",
      props: [
        STATE_PROPS.value("string", 'RRULE, such as "FREQ=WEEKLY;BYDAY=TU"'),
        STATE_PROPS.defaultValue("string", '"FREQ=WEEKLY"'),
        STATE_PROPS.onValueChange(
          "(rule: string) => void",
          "with the new RRULE"
        ),
        {
          name: "start",
          type: "Date",
          default: "today",
          description:
            "First occurrence. Sets the default weekday, month day and time, and where the preview starts.",
        },
        {
          name: "showPreview",
          type: "number",
          default: "0",
          description: "How many upcoming occurrences to list.",
        },
        {
          name: "exdates",
          type: "(Date | string)[]",
          description:
            "List of individual dates to skip/exclude from occurrence calculations.",
        },
        {
          name: "tzid",
          type: "string",
          description:
            "Timezone identifier for interpreting calendar timestamps.",
        },
      ],
      rest: "<fieldset>",
    },
    {
      name: "parseRRule, formatRRule, describeRecurrence, occurrences",
      signature:
        "parseRRule(rule: string): Recurrence; formatRRule(recurrence: Recurrence, options?: { prefix?: boolean; multiline?: boolean }): string; describeRecurrence(recurrence: Recurrence, start: Date): string; occurrences(recurrence: Recurrence, start: Date, limit: number, options?: { exdates?: (Date | string)[]; tzid?: string }): Date[]",
      description:
        "Import from @/lib/recurrence to read, write, summarize or expand a rule outside the editor with unknown parts preservation, BYSETPOS, BYMONTH, and EXDATE support.",
    },
  ],
  "saved-views": [
    {
      name: "SavedViews",
      description:
        "Switch, create, rename, duplicate, delete and persist named view configurations with an unsaved changes state.",
      props: [
        {
          name: "views",
          type: "SavedView<T>[]",
          description: "Controlled list of views.",
        },
        {
          name: "defaultViews",
          type: "SavedView<T>[]",
          default: "[]",
          description: "Initial list of views when uncontrolled.",
        },
        {
          name: "onViewsChange",
          type: "(views: SavedView<T>[]) => void",
          description:
            "Called when views are created, renamed, duplicated, or deleted.",
        },
        {
          name: "activeId",
          type: "string",
          description: "Controlled active view ID.",
        },
        {
          name: "defaultActiveId",
          type: "string",
          description: "Initial active view ID when uncontrolled.",
        },
        {
          name: "onActiveChange",
          type: "(activeId: string) => void",
          description: "Called when the active view changes.",
        },
        {
          name: "currentData",
          type: "T",
          description:
            "Current configuration data. New views take it, Save writes it to the active view, and isDirty is worked out by comparing it with the active view's data. Keep it structured-cloneable, since Duplicate copies view data with structuredClone.",
        },
        {
          name: "isEqual",
          type: "(saved: T, current: T) => boolean",
          default: "isViewDataEqual",
          description:
            "Equality rule for dirty tracking. The default is a deep compare that ignores key order and undefined fields. Views with no data are never dirty.",
        },
        {
          name: "isDirty",
          type: "boolean",
          description:
            "Overrides the computed unsaved state and skips the compare. Shows the unsaved indicator and the Save and Discard buttons. Leave it out to compare currentData with the active view.",
        },
        {
          name: "onSave",
          type: "(view: SavedView<T>) => void | PromiseLike<unknown>",
          description:
            "Called when the Save button is clicked. Return a Promise or other thenable to mark the view pending and undo the change if it rejects or the callback throws.",
        },
        {
          name: "onReset",
          type: "(view: SavedView<T>) => void",
          description: "Called when the Discard button is clicked.",
        },
        {
          name: "onCreate",
          type: "(view: SavedView<T>) => void | PromiseLike<unknown>",
          description:
            "Called when a new view is created. Return a Promise or other thenable to mark the view pending and undo the change if it rejects or the callback throws.",
        },
        {
          name: "onRename",
          type: "(view: SavedView<T>, newName: string) => void | PromiseLike<unknown>",
          description:
            "Called when a view is renamed. Return a Promise or other thenable to mark the view pending and undo the change if it rejects or the callback throws.",
        },
        {
          name: "onDuplicate",
          type: "(newView: SavedView<T>, sourceView: SavedView<T>) => void | PromiseLike<unknown>",
          description:
            "Called when a view is duplicated. Return a Promise or other thenable to mark the view pending and undo the change if it rejects or the callback throws.",
        },
        {
          name: "onDelete",
          type: "(deletedViewId: string) => void | PromiseLike<unknown>",
          description:
            "Called when a view is deleted. Return a Promise or other thenable to mark the view pending and undo the change if it rejects or the callback throws.",
        },
        {
          name: "onSetDefault",
          type: "(defaultViewId: string) => void | PromiseLike<unknown>",
          description:
            "Called when a view is marked as default. Return a Promise or other thenable to mark the view pending and undo the change if it rejects or the callback throws.",
        },
        {
          name: "onError",
          type: '(error: unknown, action: "create" | "rename" | "duplicate" | "delete" | "setDefault" | "save") => void',
          description:
            "Called with the rejection reason after a failed change, for logging or a toast. Without it the error goes to console.error. An inline alert is shown either way.",
        },
        {
          name: "variant",
          type: '"tabs" | "select"',
          default: '"tabs"',
          description:
            "Display mode: horizontal tablist or compact dropdown selector.",
        },
        {
          name: "showReset",
          type: "boolean",
          default: "true",
          description:
            "Whether to show the Discard button when isDirty is true.",
        },
        {
          name: "allowCreate",
          type: "boolean",
          default: "true",
          description: "Whether to allow creating new views.",
        },
        {
          name: "allowRename",
          type: "boolean",
          default: "true",
          description: "Whether to allow renaming views.",
        },
        {
          name: "allowDuplicate",
          type: "boolean",
          default: "true",
          description: "Whether to allow duplicating views.",
        },
        {
          name: "allowDelete",
          type: "boolean",
          default: "true",
          description: "Whether to allow deleting views.",
        },
        {
          name: "allowSetDefault",
          type: "boolean",
          default: "true",
          description: "Whether to allow setting a view as default.",
        },
        {
          name: "placeholder",
          type: "string",
          default: '"New view name..."',
          description: "Placeholder text for new view inputs.",
        },
      ],
      rest: "<div>",
    },
    {
      name: "createSavedView, duplicateSavedView, renameSavedView, deleteSavedView, setDefaultSavedView",
      signature:
        "createSavedView(name: string, options?: Partial<SavedView<T>>): SavedView<T>; duplicateSavedView(source: SavedView<T>, views: SavedView<T>[]): SavedView<T>; renameSavedView(views: SavedView<T>[], id: string, name: string): SavedView<T>[]; deleteSavedView(views: SavedView<T>[], id: string, activeId?: string): { views: SavedView<T>[]; nextActiveId: string | null }; setDefaultSavedView(views: SavedView<T>[], id: string): SavedView<T>[]",
      description: "Pure logic helpers imported from @/lib/saved-views.",
    },
    {
      name: "isViewDataEqual, isViewDirty",
      signature:
        "isViewDataEqual(a: unknown, b: unknown): boolean; isViewDirty(view: SavedView<T> | undefined, currentData: T | undefined, isEqual?: (saved: T, current: T) => boolean): boolean",
      description:
        "The dirty tracking rule. Plain objects compare deeply with key order ignored and undefined fields treated as missing. Arrays keep their order, dates compare by time, regular expressions compare by source and flags, Set members and Map values compare deeply, Map keys compare by identity, cyclic data is safe, and objects of different types are never equal. Other class instances compare by own enumerable fields only, so pass isEqual for Temporal, URL and similar types. A view with no data is never dirty.",
    },
    {
      name: "readViewParam, writeViewParam",
      signature:
        "readViewParam(search: string | URLSearchParams, views: SavedView<T>[], key?: string): string | undefined; writeViewParam(search: string | URLSearchParams, activeId: string, key?: string): string",
      description:
        'Map a ?view= search param to an active id and back, keeping other params. A missing or unknown id resolves to the current default view, or the first view when none is the default, so activeId stays controlled. The active view can then change without onActiveChange (back and forward, or a new default while the URL has no param), so derive the working data from activeId. key defaults to "view".',
    },
  ],
  "secret-field": [
    {
      name: "SecretField",
      description:
        "A read-only masked value with a reveal toggle and a copy button. Copy gives the full value even while it is masked. Name it with aria-label or aria-labelledby.",
      props: [
        {
          name: "value",
          type: "string",
          required: true,
          description: "The secret to display and copy.",
        },
        {
          name: "visibleChars",
          type: "number",
          default: "4",
          description:
            "Trailing characters left visible while masked. Values this short or shorter stay fully masked.",
        },
        {
          name: "revealed",
          type: "boolean",
          description: "Controlled reveal state.",
        },
        {
          name: "defaultRevealed",
          type: "boolean",
          default: "false",
          description: "Initial reveal state when uncontrolled.",
        },
        {
          name: "onRevealedChange",
          type: "(revealed: boolean) => void",
          description: "Called when the reveal button is toggled.",
        },
      ],
      rest: "<div>",
    },
  ],
  "shortcut-cheatsheet": [
    {
      name: "ShortcutCheatsheet",
      description:
        "A dialog that lists shortcuts by section with a search field. It renders no button of its own: press the trigger, or set open from your own control.",
      props: [
        {
          name: "sections",
          type: "{ title: string; shortcuts: { keys: string; label: string }[] }[]",
          required: true,
          description:
            'Shortcuts by section. keys uses the ShortcutRecorder format, such as "Mod+K".',
        },
        {
          name: "trigger",
          type: "string",
          default: '"?"',
          description:
            'A character, or a shortcut string such as "Mod+/", that opens the cheatsheet from anywhere on the page except text fields. An uppercase letter reads as a shortcut, so "G" is the G key without Shift. An empty string turns it off.',
        },
        {
          name: "open",
          type: "boolean",
          description: "Controlled open state.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "false",
          description: "Initial open state when uncontrolled.",
        },
        {
          name: "onOpenChange",
          type: "(open: boolean) => void",
          description: "Called when the cheatsheet opens or closes.",
        },
      ],
      rest: "DialogContent",
    },
    {
      name: "filterSections, matchesTrigger",
      signature:
        "filterSections(sections: CheatsheetSection[], query: string): CheatsheetSection[]; matchesTrigger(event: KeyboardEvent, trigger: string, isMac: boolean): boolean",
      description:
        "Import from @/lib/shortcut-cheatsheet to reuse the search or the trigger check outside the dialog.",
    },
  ],
  "shortcut-recorder": [
    {
      name: "ShortcutRecorder",
      description:
        'Click, then press a combination. The value is portable, such as "Mod+Shift+K", where Mod is Cmd on macOS and Ctrl elsewhere.',
      props: [
        STATE_PROPS.value("string", "shortcut"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(shortcut: string) => void",
          "with the recorded shortcut"
        ),
        {
          name: "placeholder",
          type: "string",
          default: '"Record shortcut"',
          description: "Text while nothing is recorded.",
        },
        {
          name: "requireModifier",
          type: "boolean",
          default: "true",
          description:
            "Ignore keys pressed without a modifier, except function keys.",
        },
      ],
      rest: "<button>",
    },
    {
      name: "ShortcutKeys",
      description:
        "Renders a stored shortcut as kbd elements for the current platform.",
      props: [
        {
          name: "shortcut",
          type: "string",
          required: true,
          description: 'A shortcut string such as "Mod+K".',
        },
      ],
      rest: "<span>",
    },
    {
      name: "matchesShortcut",
      signature:
        "matchesShortcut(event: KeyboardEvent, shortcut: string, isMac: boolean): boolean",
      description:
        "Import from @/lib/shortcut. Returns true when a keyboard event matches a stored shortcut.",
    },
  ],
  "signature-pad": [
    {
      name: "SignaturePad",
      description:
        "A drawing surface for mouse, pen and touch with undo and clear, plus a typed-name fallback for keyboard and screen reader users. Exports SVG markup or a PNG data URL. Pass aria-label.",
      props: [
        STATE_PROPS.value("string", "signature"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string) => void",
          "at the end of each stroke, or an empty string once nothing is signed"
        ),
        {
          name: "format",
          type: '"svg" | "png"',
          default: '"svg"',
          description: "SVG markup, or a transparent PNG data URL.",
        },
        {
          name: "penColor",
          type: "string",
          default: '"currentColor"',
          description:
            "Any CSS color. currentColor stays in exported SVG so it inherits; other colors are resolved at export.",
        },
        {
          name: "name",
          type: "string",
          description: "Submits the value through a hidden input.",
        },
        {
          name: "placeholder",
          type: "string",
          default: '"Sign here"',
          description: "Hint shown on the empty pad.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Dims the pad and ignores pointer input.",
        },
      ],
      rest: "<div>",
    },
  ],
  "sortable-list": [
    {
      name: "SortableList",
      description:
        "Reorderable list with drag-and-drop and full keyboard accessibility. Space or Enter picks up and drops an item, arrow keys, Home and End move it, and Escape cancels the move for both keyboard and pointer.",
      props: [
        STATE_PROPS.value("T[]", "list of items"),
        STATE_PROPS.defaultValue("T[]", "[]"),
        STATE_PROPS.onValueChange(
          "(items: T[]) => void",
          "once on drop, if the order changed"
        ),
        {
          name: "children",
          type: "(item: T, index: number) => ReactNode",
          required: true,
          description:
            "Renders one SortableItem. index follows the live order during a move.",
        },
        {
          name: "getKey",
          type: "(item: T, index: number) => string | number",
          description:
            "Extracts a unique key from each item. Defaults to the item itself for strings and numbers, then item.id, then the index.",
        },
        {
          name: "getItemLabel",
          type: "(item: T, index: number) => string",
          description:
            "Returns an accessible name for screen reader announcements.",
        },
        {
          name: "orientation",
          type: '"vertical" | "horizontal"',
          default: '"vertical"',
          description: "Layout direction and keyboard arrow axis.",
        },
        {
          name: "disabled",
          type: "boolean",
          description:
            "Prevents dragging and keyboard reordering across the list.",
        },
      ],
      rest: "<motion.ul>",
    },
    {
      name: "SortableItem",
      description:
        "An individual reorderable row. If no SortableDragHandle is present inside, the item itself is draggable and keyboard-interactive, except from links, buttons and form controls inside it. data-grabbed and data-dragging mark the moving row.",
      props: [
        {
          name: "value",
          type: "string | number",
          required: true,
          description: "Unique identifier matching the item's key.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables reordering for this specific item.",
        },
      ],
      rest: "<motion.li>",
    },
    {
      name: "SortableDragHandle",
      description:
        "Optional handle button that restricts dragging and keyboard focus to a grab icon. Its accessible name comes from getItemLabel.",
      rest: "<button>",
    },
  ],
  stepper: [
    {
      name: "Stepper",
      description:
        "Compose StepperList > StepperItem > StepperTrigger > StepperIndicator + StepperTitle, with StepperSeparator between items and a StepperContent for each step. Steps are zero-based.",
      props: [
        STATE_PROPS.value("number", "step"),
        STATE_PROPS.defaultValue("number", "0"),
        STATE_PROPS.onValueChange(
          "(step: number) => void",
          "when the step changes"
        ),
        {
          name: "linear",
          type: "boolean",
          default: "false",
          description: "Disable steps past the furthest one reached.",
        },
        {
          name: "stepCount",
          type: "number",
          description:
            "Number of steps, so StepperNext disables on the last one.",
        },
        {
          name: "orientation",
          type: '"horizontal" | "vertical"',
          default: '"horizontal"',
          description: "Layout direction.",
        },
      ],
      rest: "Tabs root",
    },
    {
      name: "StepperItem",
      description:
        'Wraps one step and sets data-state to "completed", "active" or "upcoming" for its children.',
      props: [
        {
          name: "step",
          type: "number",
          required: true,
          description: "The step this item stands for.",
        },
      ],
      rest: "<div>",
    },
    {
      name: "StepperContent",
      description: "Panel shown while its step is active.",
      props: [
        {
          name: "step",
          type: "number",
          required: true,
          description: "The step this panel belongs to.",
        },
      ],
      rest: "Tabs panel",
    },
    {
      name: "StepperPrevious, StepperNext",
      description:
        "Buttons that move one step back or forward. They disable on the first step and, with stepCount, on the last.",
      props: [
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description:
            "Render the child element, such as a Button, instead of a button.",
        },
      ],
      rest: "<button>",
    },
    {
      name: "useStepper",
      signature:
        "useStepper(): { activeStep: number; setActiveStep: (step: number) => void }",
      description: "For custom controls rendered inside Stepper.",
    },
  ],
  "tags-input": [
    {
      name: "TagsInput",
      description:
        "Enter or comma adds a tag. Backspace or ArrowLeft at the start of the field selects the last tag and announces it, and a second Backspace removes it. Pasted text splits on commas, tabs and newlines.",
      props: [
        STATE_PROPS.value("string[]", "list of tags"),
        STATE_PROPS.defaultValue("string[]", "[]"),
        STATE_PROPS.onValueChange(
          "(tags: string[]) => void",
          "after a tag is added or removed"
        ),
        {
          name: "max",
          type: "number",
          description:
            "Most tags allowed. When full the field turns read-only, and tags stay removable by keyboard.",
        },
        {
          name: "validate",
          type: "(tag: string) => boolean",
          description: "Return false to reject a tag.",
        },
        {
          name: "allowDuplicates",
          type: "boolean",
          default: "false",
          description: "Accept a tag that is already in the list.",
        },
        {
          name: "addOnBlur",
          type: "boolean",
          default: "false",
          description:
            "Add the typed text as a tag when the field loses focus.",
        },
      ],
      rest: "<input>",
    },
  ],
  "template-input": [
    {
      name: "TemplateInput",
      description:
        "A textarea that suggests variables after {{. Arrow keys move through the list, Enter or Tab inserts {{value}}, and Escape closes it. Known variables are highlighted and unknown ones get a wavy underline.",
      props: [
        STATE_PROPS.value("string", "template"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string) => void",
          "when the template changes"
        ),
        {
          name: "variables",
          type: "MentionOption[]",
          required: true,
          description:
            "The variables that can be inserted, each { value, label, description? }. Typing after {{ filters on value and label.",
        },
        {
          name: "className",
          type: "string",
          description:
            "Applied to the bordered wrapper, which also sets the font for the text and its highlights.",
        },
      ],
      rest: "<textarea>",
    },
    {
      name: "findUnknownVariables",
      signature:
        "findUnknownVariables(text: string, variables: MentionOption[]): string[]",
      description:
        "Names used as {{name}} in the text that are not in variables, without duplicates. Exported from the lib file.",
    },
  ],
  "time-field": [
    {
      name: "TimeField",
      description:
        "Segmented hour and minute input. The root has role=group, so pass aria-label or aria-labelledby.",
      props: [
        STATE_PROPS.value("string", 'time as "HH:mm" in 24 hour time'),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string) => void",
          'with "HH:mm", or an empty string when cleared'
        ),
        {
          name: "hourCycle",
          type: "12 | 24",
          default: "24",
          description: "12 adds an AM/PM segment.",
        },
        {
          name: "minuteStep",
          type: "number",
          default: "1",
          description: "Amount the arrow keys change the minutes by.",
        },
        {
          name: "name",
          type: "string",
          description: "Submits the value through a hidden input.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables every segment.",
        },
      ],
      rest: "<div>",
    },
  ],
  timeline: [
    {
      name: "Timeline",
      description:
        "Compose Timeline > TimelineItem > TimelineIndicator + TimelineContent, with TimelineHeader holding TimelineTitle and TimelineTime, then TimelineDescription. Every part spreads its props onto its element, and none needs client JavaScript.",
      rest: "<ol>",
    },
    {
      name: "TimelineIndicator",
      description: "The dot next to an item.",
      props: [
        {
          name: "variant",
          type: '"default" | "current" | "success" | "destructive"',
          default: '"default"',
          description: "Color and ring of the dot.",
        },
      ],
      rest: "<span>",
    },
  ],
  "timezone-picker": [
    {
      name: "TimezonePicker",
      description:
        "A button that opens a searchable list of IANA time zones, each with its UTC offset and current local time. In the list, arrow keys move, Enter selects, and Escape closes it and returns focus to the button.",
      props: [
        STATE_PROPS.value("string", "IANA time zone name"),
        STATE_PROPS.defaultValue("string", '""'),
        STATE_PROPS.onValueChange(
          "(value: string) => void",
          "when a time zone is picked"
        ),
        {
          name: "timeZones",
          type: "string[]",
          default: '"every zone the browser supports"',
          description:
            'Limits the list to these IANA names. The default comes from Intl.supportedValuesOf("timeZone"), with UTC added if missing and old names such as Asia/Calcutta shown under current ones. Names passed here get the same renaming, and duplicates are dropped.',
        },
        {
          name: "placeholder",
          type: "string",
          default: '"Select a time zone"',
          description: "Shown while no zone is selected.",
        },
      ],
      rest: "<button>",
    },
  ],
  toast: [
    {
      name: "Toaster",
      description:
        "Render once near the root of the app. On Radix it takes every prop of shadcn's Sonner Toaster, and on Base UI every prop of shadcn's toast Toaster. The default duration it sets is the shortest a toast stays up.",
      props: [
        {
          name: "duration",
          type: "number",
          default: "4000",
          description:
            "Radix. Default time on screen in ms. Toasts with long text stay longer.",
        },
        {
          name: "timeout",
          type: "number",
          default: "5000",
          description:
            "Base UI. Default time on screen in ms. Toasts with long text stay longer.",
        },
      ],
      rest: "Sonner Toaster (Radix) or Toast.Provider (Base UI)",
    },
    {
      name: "toast",
      signature:
        "toast(message, options?) and toast.success, info, warning, error, loading, promise, dismiss (Radix); toast.add(options), close, update, promise (Base UI)",
      description:
        "The same calls as shadcn. Import it from the toast file, not from sonner, to get merging, reading-time durations and toast.undo. Error toasts are announced assertively.",
      props: [
        {
          name: "id",
          type: "string | number",
          description:
            "Radix. A toast of the same type with an id that is already showing merges into it: the newest content wins, a count badge appears and the timer restarts. Reusing the id with another type, such as loading then success, updates the toast without a count.",
        },
        {
          name: "key",
          type: "string",
          description: "Base UI. Same merging as id on Radix.",
        },
        {
          name: "duration",
          type: "number",
          description:
            "Radix. Time on screen in ms. When unset it grows with the length of the title and description.",
        },
        {
          name: "timeout",
          type: "number",
          description:
            "Base UI. Time on screen in ms, 0 to stay until closed. When unset it grows with the length of the title and description, unless the Toaster timeout is 0, which keeps every toast up until closed.",
        },
        {
          name: "persist",
          type: "boolean",
          description:
            "Hands the toast to onToastPersist listeners when it closes, ready for the notification inbox. Only text titles and descriptions are passed on, so a toast whose title is a React element is not persisted.",
        },
      ],
    },
    {
      name: "toast.undo",
      signature:
        "toast.undo(message, options) on Radix, toast.undo(options) with a title on Base UI",
      description:
        "Shows a toast with an Undo button and a countdown ring that pauses while the toasts are hovered or focused. The action is delayed until the toast goes away.",
      props: [
        {
          name: "onCommit",
          type: "() => void",
          required: true,
          description:
            "Runs once when the toast times out, is swiped away or closed, or the page unloads. Because it can run during pagehide, send its request with fetch(url, { keepalive: true }) or navigator.sendBeacon, which the browser finishes after the tab closes.",
        },
        {
          name: "onUndo",
          type: "() => void",
          description: "Runs when Undo is clicked. onCommit then never runs.",
        },
        {
          name: "undoLabel",
          type: "ReactNode",
          default: '"Undo"',
          description: "Text of the Undo button.",
        },
        {
          name: "shortcut",
          type: "string",
          description:
            'Shortcut such as "Mod+Z" that triggers Undo on the newest undo toast while it is open. Shown as ⌘Z on a Mac and Ctrl+Z elsewhere, and ignored while focus is in a text field.',
        },
      ],
    },
    {
      name: "toast.progress",
      signature:
        "toast.progress(message, options) on Radix, toast.progress(options) with a title on Base UI",
      description:
        "Shows a determinate progress bar that stays up until replaced. Call it again with the same id to move the bar, then show a success or error toast with that id.",
      props: [
        {
          name: "value",
          type: "number",
          required: true,
          description: "Progress from 0 to 100. Values outside are clamped.",
        },
      ],
    },
    {
      name: "onToastPersist",
      signature:
        "onToastPersist(listener: (toast: PersistedToast) => void): () => void",
      description:
        "Subscribes to toasts shown with persist. Each one arrives as { id, title, body?, createdAt } when it closes, which fits NotificationInbox items. Returns an unsubscribe function.",
    },
  ],
  tour: [
    {
      name: "Tour",
      description:
        "Wrap the page in Tour and mark elements with TourTarget. Arrow keys move between steps and Escape ends the tour. Focus stays in the card and returns to the opener when it closes.",
      props: [
        {
          name: "steps",
          type: "TourStep[]",
          required: true,
          description:
            'Steps in order: { target, title, description?, side? }, where side is "top", "right", "bottom" or "left".',
        },
        {
          name: "open",
          type: "boolean",
          description: "Controlled open state.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "false",
          description: "Initial open state when uncontrolled.",
        },
        {
          name: "onOpenChange",
          type: "(open: boolean) => void",
          description: "Called when the tour starts or ends.",
        },
        {
          name: "step",
          type: "number",
          description: "Controlled zero-based step.",
        },
        {
          name: "defaultStep",
          type: "number",
          default: "0",
          description: "Initial step when uncontrolled.",
        },
        {
          name: "onStepChange",
          type: "(step: number) => void",
          description: "Called when the step changes.",
        },
        {
          name: "onComplete",
          type: "() => void",
          description: "Called after Finish on the last step.",
        },
      ],
    },
    {
      name: "TourTarget",
      description:
        "Marks its single child as a tour target without adding an element.",
      props: [
        {
          name: "name",
          type: "string",
          required: true,
          description: "Matches a step's target.",
        },
      ],
    },
  ],
  "trace-waterfall": [
    {
      name: "TraceWaterfall",
      description:
        "Waterfall timeline displaying distributed request spans as a collapsible tree and duration bars on a shared time axis.",
      props: [
        {
          name: "spans",
          type: "Span[]",
          required: true,
          description:
            "Array of trace spans with id, parentId?, name, start, duration, status?, service?, color?, attributes?: Record<string, string | number | boolean>.",
        },
        {
          name: "selectedSpanId",
          type: "string | null",
          description: "Controlled id of the selected span.",
        },
        {
          name: "defaultSelectedSpanId",
          type: "string | null",
          default: "null",
          description: "Initially selected span id when uncontrolled.",
        },
        {
          name: "onSpanSelect",
          type: "(span: Span | null) => void",
          description: "Called when a span is selected or deselected.",
        },
        {
          name: "expandedSpanIds",
          type: "string[]",
          description: "Controlled ids of open branches.",
        },
        {
          name: "defaultExpandedSpanIds",
          type: "string[]",
          default: "all parent spans",
          description: "Initially expanded branch ids when uncontrolled.",
        },
        {
          name: "onExpandedChange",
          type: "(expandedIds: string[]) => void",
          description: "Called when a branch opens or closes.",
        },
        {
          name: "formatTime",
          type: "(ms: number) => string",
          default: "formatDuration",
          description:
            "Formats millisecond values for ruler ticks, row durations and the details panel.",
        },
        {
          name: "minBarWidth",
          type: "number",
          default: "4",
          description:
            "Minimum pixel width for bars, ensuring zero-duration spans remain visible.",
        },
        {
          name: "showTimeAxis",
          type: "boolean",
          default: "true",
          description: "Renders the top timeline ruler with time intervals.",
        },
        {
          name: "showGridLines",
          type: "boolean",
          default: "true",
          description:
            "Renders vertical alignment grid lines across rows matching ruler ticks.",
        },
        {
          name: "showSpanDetails",
          type: "boolean",
          default: "true",
          description:
            "Shows a panel under the waterfall with the selected span's timing, status and attributes. Turn off when you render your own panel from onSpanSelect.",
        },
      ],
      rest: "<div>",
    },
  ],
  "transfer-list": [
    {
      name: "TransferList",
      description:
        "Dual-panel listbox for moving items between available and selected sets with search and multi-selection.",
      props: [
        {
          name: "items",
          type: "T[]",
          required: true,
          description:
            "All items across both lists, each with id, label and optional description and disabled.",
        },
        STATE_PROPS.value("string[]", "keys in the selected panel"),
        STATE_PROPS.defaultValue("string[]", "[]"),
        STATE_PROPS.onValueChange(
          "(value: string[]) => void",
          "after items are moved between lists"
        ),
        {
          name: "titles",
          type: "[string, string]",
          default: '["Available", "Selected"]',
          description: "Headers for the source and target panels.",
        },
        {
          name: "searchable",
          type: "boolean",
          default: "false",
          description: "Adds a search input to each panel.",
        },
        {
          name: "showSelectAll",
          type: "boolean",
          default: "true",
          description: "Renders select-all checkboxes in both panel headers.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description:
            "Disables interaction across both panels and action buttons.",
        },
        {
          name: "renderItem",
          type: "(item: T) => React.ReactNode",
          description: "Custom renderer for items inside the listboxes.",
        },
      ],
      rest: "<div>",
    },
  ],
  "tree-view": [
    {
      name: "TreeView",
      description:
        "A WAI-ARIA tree. Arrow keys move and expand, Home and End jump, Enter or Space selects, and typing jumps to the next matching node. Always pass aria-label. Without virtual, every open row is in the DOM: 1,000 rows take about 26 ms per arrow key and 10,000 take about 600 ms (Chrome, Apple M4, dev build). With virtual, 100,000 open rows expand in about 17 ms and scroll and move in under 10 ms. Browsers cap a scroll area near 16.7 million pixels, so past about 520,000 open rows the end of a virtual tree cannot be reached.",
      props: [
        {
          name: "items",
          type: "TreeNode[]",
          required: true,
          description: "Nodes to render.",
        },
        {
          name: "expanded",
          type: "string[]",
          description: "Controlled ids of open branches.",
        },
        {
          name: "defaultExpanded",
          type: "string[]",
          default: "[]",
          description: "Initially open branches when uncontrolled.",
        },
        {
          name: "onExpandedChange",
          type: "(expanded: string[]) => void",
          description:
            "Called when a branch opens or closes. Load lazy children here.",
        },
        {
          name: "loadChildren",
          type: "(node: TreeNode) => Promise<unknown>",
          description:
            "Runs when a branch with isBranch and no children opens. Add the children to items before the promise resolves. A rejection shows a Retry row; ArrowRight on the branch retries too.",
        },
        {
          name: "multiple",
          type: "boolean",
          default: "false",
          description:
            "Checkbox selection. Rows get aria-checked, branches show mixed when partly checked, and selected becomes string[].",
        },
        {
          name: "selected",
          type: "string | null | string[]",
          description:
            "Controlled id of the selected node, or every checked id when multiple. A checked branch also checks children that load later.",
        },
        {
          name: "defaultSelected",
          type: "string | null | string[]",
          default: "null or []",
          description: "Initial selection when uncontrolled.",
        },
        {
          name: "onSelectedChange",
          type: "((id: string) => void) | ((ids: string[]) => void)",
          description:
            "Called with the selected id, or with every checked id when multiple.",
        },
        {
          name: "virtual",
          type: "boolean",
          default: "false",
          description:
            "Render only the rows in view, at a fixed 32px each. The tree becomes the scroll container, so give it a height through className. Focus stays on a row after it scrolls away.",
        },
      ],
      rest: "<ul>",
    },
    {
      name: "TreeNode",
      description:
        "One node. A node with isBranch and no children shows a loading row while open; pass loadChildren to fetch them.",
      props: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Unique id.",
        },
        {
          name: "label",
          type: "ReactNode",
          required: true,
          description: "Content of the row.",
        },
        {
          name: "textValue",
          type: "string",
          description: "Text for typeahead when label is not a string.",
        },
        {
          name: "icon",
          type: "ReactNode",
          description: "Shown before the label.",
        },
        { name: "children", type: "TreeNode[]", description: "Child nodes." },
        {
          name: "isBranch",
          type: "boolean",
          description: "Treat the node as a branch before its children load.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Skip the node when moving and selecting.",
        },
      ],
    },
  ],
  "unit-input": [
    {
      name: "UnitInput",
      description:
        "A spinbutton text field with a unit select. The value stays in the base unit, and changing the unit only changes what is on screen.",
      props: [
        STATE_PROPS.value("number | null", "value in the base unit"),
        STATE_PROPS.defaultValue("number | null", "null"),
        STATE_PROPS.onValueChange(
          "(value: number | null) => void",
          "with the value in the base unit, or null when cleared"
        ),
        {
          name: "units",
          type: "{ id: string; label: string; factor: number }[]",
          default: "BYTE_UNITS",
          description:
            "Units to pick from. factor is how many base units one of it holds.",
        },
        {
          name: "unit",
          type: "string",
          description: "Controlled unit id.",
        },
        {
          name: "defaultUnit",
          type: "string",
          description:
            "Initial unit id when uncontrolled. Defaults to the largest unit that keeps the number at 1 or more.",
        },
        {
          name: "onUnitChange",
          type: "(unit: string) => void",
          description:
            "Called with the unit id when the select or typed text changes it.",
        },
        {
          name: "min",
          type: "number",
          description: "Minimum value in the base unit.",
        },
        {
          name: "max",
          type: "number",
          description: "Maximum value in the base unit.",
        },
        {
          name: "step",
          type: "number",
          default: "1",
          description: "Arrow key step, in the current unit.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables the field and the unit select.",
        },
        {
          name: "name",
          type: "string",
          description: "Submits the base value through a hidden input.",
        },
      ],
      rest: "<input>",
    },
  ],
  "uptime-bar": [
    {
      name: "UptimeBar",
      description:
        "Daily service health segments with uptime percentage, accessible labels and popover details. Keyboard navigation with Arrow keys, Home, and End.",
      props: [
        {
          name: "days",
          type: "{ date: string | Date; status: UptimeStatus; uptime?: number; note?: string }[]",
          required: true,
          description:
            'Daily status records, oldest first. `status` is "operational", "degraded", "down" or "no-data". `uptime` is a 0 to 100 percentage that overrides the status score, and `note` shows in the popover.',
        },
        {
          name: "title",
          type: "ReactNode",
          description: "Service name or header title.",
        },
        {
          name: "showPercentage",
          type: "boolean",
          default: "true",
          description: "Whether to render the calculated uptime percentage.",
        },
        {
          name: "showRangeLabels",
          type: "boolean",
          default: "true",
          description: "Whether to render date range start and end labels.",
        },
        {
          name: "startLabel",
          type: "ReactNode",
          default: "`${days.length} days ago`",
          description: "Custom label for the start of the date range.",
        },
        {
          name: "endLabel",
          type: "ReactNode",
          default: '"Today"',
          description: "Custom label for the end of the date range.",
        },
        {
          name: "degradedWeight",
          type: "number",
          default: "0.5",
          description:
            "Weight given to degraded days when calculating uptime (0 to 1).",
        },
        {
          name: "decimals",
          type: "number",
          default: "2",
          description: "Number of decimal places in the uptime percentage.",
        },
        STATE_PROPS.value("number | null", "open day popover index"),
        STATE_PROPS.defaultValue("number | null", "null"),
        STATE_PROPS.onValueChange(
          "number | null",
          "the open day popover index changes"
        ),
        {
          name: "renderDayContent",
          type: "(day: UptimeDay, index: number) => ReactNode",
          description: "Custom renderer for the popover content.",
        },
      ],
      rest: "<div>",
    },
    {
      name: "UptimeBarLegend",
      description:
        "Status legend showing dot indicators and labels for uptime states.",
      props: [
        {
          name: "statuses",
          type: "UptimeStatus[]",
          default: '["operational", "degraded", "down", "no-data"]',
          description: "Status keys to display in the legend.",
        },
      ],
      rest: "<div>",
    },
  ],
  "virtual-list": [
    {
      name: "VirtualList",
      signature: "<T>",
      description:
        "A scrolling list that mounts only the rows in view. Rows measure themselves, so heights can vary, and the focused row stays mounted while scrolled away. Set a height through className.",
      props: [
        {
          name: "items",
          type: "T[]",
          required: true,
          description: "The full list of rows.",
        },
        {
          name: "estimateSize",
          type: "number",
          required: true,
          description:
            "Height in pixels assumed for a row until it is measured.",
        },
        {
          name: "children",
          type: "(item: T, index: number) => ReactNode",
          required: true,
          description: "Renders one row.",
        },
        {
          name: "overscan",
          type: "number",
          default: "4",
          description: "Extra rows mounted above and below the viewport.",
        },
        {
          name: "getItemKey",
          type: "(item: T, index: number) => Key",
          default: "index",
          description:
            "Stable identity for a row, so measured heights and focus follow it when the list changes.",
        },
      ],
      rest: "<div>",
    },
  ],
}
