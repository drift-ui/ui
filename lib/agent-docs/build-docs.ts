import registry from "@/registry.json"
import { COMPONENT_API, type ApiPart } from "@/lib/agent-docs/component-api"
import { COMPONENT_USAGE } from "@/lib/agent-docs/component-usage"
import { siteConfig } from "@/lib/site-config"

type RegistryItem = (typeof registry.items)[number] & {
  dependencies?: string[]
  registryDependencies?: string[]
}

const FOUNDATION_TYPES = new Set([
  "registry:lib",
  "registry:theme",
  "registry:hook",
])
const SHADCN_BASE_ITEMS = new Set([
  "button",
  "badge",
  "input",
  "label",
  "card",
  "dialog",
  "popover",
])
const MCP_CLIENTS = "claude, cursor, vscode, codex or opencode"

const items = registry.items as RegistryItem[]

function itemUrl(siteUrl: string, name: string) {
  return `${siteUrl}/r/${name}.json`
}

function isComponent(item: RegistryItem) {
  return !FOUNDATION_TYPES.has(item.type) && !SHADCN_BASE_ITEMS.has(item.name)
}

function listLine(siteUrl: string, item: RegistryItem) {
  return `- [${item.title}](${itemUrl(siteUrl, item.name)}): ${item.description}`
}

export function buildAgentPrompt(siteUrl = siteConfig.url) {
  return `Install components from the drift-ui registry into this project.

drift-ui is a shadcn-compatible component registry built on Radix or Base UI with Tailwind v4. Read ${siteUrl}/llms.txt for the component list and ${siteUrl}/llms-full.txt for props and usage examples before writing code.

1. Make sure the project uses shadcn. If there is no components.json, run \`npx shadcn@latest init\` and accept the defaults that match the project.
2. Choose the components this task needs from llms.txt and install them, for example \`npx shadcn@latest add @drift-ui/tags-input @drift-ui/stepper\`. The @drift-ui namespace is built into the shadcn CLI, so do not add it to components.json. The CLI also installs their registry and npm dependencies, picks the Base UI build for a \`base-\` style and Radix for any other, and installs shape tokens for the shadcn create style in components.json, such as \`radix-nova\`, with Vega values for any other style.
3. Import them from the project's ui alias, usually @/components/ui/<name>. Compose them in feature code rather than editing the installed files, and keep the project's existing theme tokens.
4. Run the project's typecheck and lint, then list the components you installed and where you used them.

Optional: \`npx shadcn@latest mcp init --client <client>\` (${MCP_CLIENTS}) lets you search and install from the registry over MCP.`
}

export function buildLlmsIndex(siteUrl = siteConfig.url) {
  const components = items.filter(isComponent)
  const foundations = items.filter((item) => !isComponent(item))

  return `# ${siteConfig.name}

> ${siteConfig.description}

Install any item with \`npx shadcn@latest add @drift-ui/<name>\`. The @drift-ui namespace is built into the shadcn CLI, so there is nothing to register. Each link below is the item's registry JSON, which contains its full source.

## Docs

- [Full usage docs](${siteUrl}/llms-full.txt): setup steps, props and a usage example for every component
- [Registry index](${siteUrl}/r/registry.json): machine readable list of every item

## Components

${components.map((item) => listLine(siteUrl, item)).join("\n")}

## Foundations

${foundations.map((item) => listLine(siteUrl, item)).join("\n")}

## Optional

- [Live previews](${siteUrl}/components): every component rendered with its install command
`
}

function apiLines(part: ApiPart) {
  const props = (part.props ?? []).map((prop) => {
    const details = [
      `\`${prop.type}\``,
      prop.required && "required",
      prop.default && `default \`${prop.default}\``,
    ].filter(Boolean)
    return `- \`${prop.name}\` (${details.join(", ")}): ${prop.description}`
  })
  const rest = part.rest ? [`Other props go to the ${part.rest}.`] : []

  const signature = part.signature ? [`\`${part.signature}\``, ""] : []

  return [
    "",
    `### ${part.name}`,
    "",
    ...signature,
    part.description,
    ...(props.length > 0 ? ["", ...props] : []),
    ...rest,
  ]
}

function itemSection(siteUrl: string, item: RegistryItem) {
  const usage = COMPONENT_USAGE[item.name]
  const dependsOn = [
    ...(item.registryDependencies ?? []),
    ...(item.dependencies ?? []),
  ]
  const lines = [
    `## ${item.title} (@drift-ui/${item.name})`,
    "",
    item.description,
    "",
    `Install: \`npx shadcn@latest add @drift-ui/${item.name}\``,
    `Source: ${itemUrl(siteUrl, item.name)}`,
  ]
  if (dependsOn.length > 0) lines.push(`Depends on: ${dependsOn.join(", ")}`)
  if (usage) lines.push("", usage.notes)
  if (usage?.example) lines.push("", "```tsx", usage.example, "```")
  for (const part of COMPONENT_API[item.name] ?? [])
    lines.push(...apiLines(part))
  return lines.join("\n")
}

export function buildLlmsFull(siteUrl = siteConfig.url) {
  const ordered = [
    ...items.filter(isComponent),
    ...items.filter((item) => !isComponent(item)),
  ]

  return `# ${siteConfig.name}: full usage docs

> ${siteConfig.description}

## Setup

${buildAgentPrompt(siteUrl)}

## Conventions

- Every component is a plain file in the project after install, with data-slot attributes on each part and className forwarded through cn().
- Inputs follow one state pattern: value + onValueChange for controlled use, defaultValue for uncontrolled use.
- Colors, radius and focus rings come from the shadcn CSS variables (--primary, --border, --ring and so on), so the project's theme applies automatically.

${ordered.map((item) => itemSection(siteUrl, item)).join("\n\n")}
`
}
