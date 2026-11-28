# Changelog

Notable changes to drift-ui. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org). Until 1.0, a minor version can change a component's API.

## [Unreleased]

## [0.1.0] - 2026-11-28

The first tagged release, covering everything from the first commit on Aug 27, 2026. Install any component with `npx shadcn add @drift-ui/<name>`.

### Components

70 components, each with a Radix build and a Base UI build.

| Category   | Count | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inputs     | 33    | Address Input, Color Picker, Cron Input, Date-Time Range, Duration Input, Emoji Picker, File Dropzone, Histogram Range, Icon Picker, Image Cropper, Inline Edit, Key Value Editor, Locale Picker, Masked Input, Mention Textarea, Multi Select, Number Input, Password Input, Phone Input, Query Input, Rating, Recurrence Editor, Regex Input, Secret Field, Shortcut Recorder, Signature Pad, Snooze Picker, Tags Input, Template Input, Time Field, Timezone Picker, Unit Input, Weekly Hours |
| Structure  | 16    | Activity Heatmap, Avatar Group, Description List, Diff Viewer, JSON Viewer, Kanban Board, Log Viewer, Request Inspector, Sortable List, Stepper, Timeline, Trace Waterfall, Tree View, Uptime Bar, Usage Meter, Virtual List                                                                                                                                                                                                                                                                     |
| Workflow   | 13    | Bulk Action Bar, Comment Thread, CSV Importer, Filter Builder, Merge Resolver, Notification Inbox, Onboarding Checklist, Permission Matrix, Saved Views, Shortcut Cheatsheet, Toast, Tour, Transfer List                                                                                                                                                                                                                                                                                         |
| Primitives | 8     | Avatar, Badge, Button, Card, Dialog, Input, Label, Popover. Same API as shadcn/ui                                                                                                                                                                                                                                                                                                                                                                                                                |

### Added

- Base UI builds. A `base-*` style in `components.json` gets the Base UI build and never installs `radix-ui`; any other style gets Radix (#23).
- Shape tokens for the shadcn create styles (Vega, Nova, Maia, Lyra, Mira, Luma, Sera, Rhea), so control height, corners and shadows follow your style (#150).
- A `warning` color token, used by every warning state.
- `/llms.txt` and `/llms-full.txt` for coding agents, plus setup steps for the shadcn MCP server.
- `key-value-editor-utils` published as a `registry:lib` item (#146).
- Docs: a live preview, source, install steps, API reference and Open in v0 link on every component page, with separate Radix and Base UI pages.

### Fixed

- `use-controllable-state` no longer drops the earlier of two functional updates made in the same tick (#178).
- Registry lib files that share a basename with their UI file now install without clashing (#136, #142).
- `key-value-editor` keeps backslashes that are not escape sequences in quoted values (#148).
- `regex-input` runs matching in a worker that can be interrupted, so a slow pattern can't freeze the page.
- `address-input` no longer breaks hydration on country names.
- Accessibility tree repairs across the docs site (#56) and CodeQL alerts (#141).

### Thanks

Thanks to [@KomalSrinivasan](https://github.com/KomalSrinivasan) for Secret Field (#91), Timezone Picker (#93), Key Value Editor (#130), Unit Input (#144), the Mention Textarea rework (#94), the flagship Diff Viewer (#129) and the registry fixes in #136, #142 and #146. Thanks to [@ananthanarayanan431](https://github.com/ananthanarayanan431) for Address Input (#111) and typed ranges such as "last 7 days" in Date-Time Range (#110).

[Unreleased]: https://github.com/drift-ui/ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/drift-ui/ui/releases/tag/v0.1.0
