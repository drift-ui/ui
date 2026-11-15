import { ArrowUpRightIcon } from "lucide-react"

import { buildAgentPrompt } from "@/lib/agent-docs/build-docs"
import { CopyCommand } from "@/components/landing/copy-command"
import { CopyTextButton } from "@/components/landing/copy-text-button"
import { SectionHeading } from "@/components/landing/section-heading"

const AGENT_FILES = [
  { href: "/llms.txt", label: "llms.txt", detail: "Component index" },
  {
    href: "/llms-full.txt",
    label: "llms-full.txt",
    detail: "Props, usage notes and examples",
  },
  {
    href: "/r/registry.json",
    label: "registry.json",
    detail: "Every item, machine readable",
  },
]

function AgentCard({
  title,
  lead,
  children,
}: {
  title: string
  lead: string
  children: React.ReactNode
}) {
  return (
    <li className="flex min-w-0 flex-col gap-5 border-b py-6 lg:pr-6 lg:[&+&]:border-l lg:[&+&]:pl-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{lead}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </li>
  )
}

export function AgentsSection() {
  return (
    <section
      id="agents"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-24 md:px-10 md:pb-36"
    >
      <SectionHeading
        title="Let your agent install them"
        lead="Coding agents read the whole registry and install only what the task needs."
      />
      <ul className="mt-12 grid reveal border-t md:mt-16 lg:grid-cols-3">
        <AgentCard
          title="Paste one prompt"
          lead="It tells Claude Code, Cursor, Codex or any agent with a terminal how to find and install components from llms.txt."
        >
          <CopyTextButton
            text={buildAgentPrompt()}
            label="Copy prompt"
            className="w-full"
          />
        </AgentCard>
        <AgentCard
          title="Read the docs as text"
          lead="The same docs, in files an agent can read in one request."
        >
          <ul className="divide-y rounded-md border">
            {AGENT_FILES.map((file) => (
              <li key={file.href}>
                <a
                  href={file.href}
                  className="group flex items-center gap-3 px-3.5 py-2.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="font-mono whitespace-nowrap">
                    {file.label}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {file.detail}
                  </span>
                  <ArrowUpRightIcon
                    aria-hidden
                    className="ml-auto size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </a>
              </li>
            ))}
          </ul>
        </AgentCard>
        <AgentCard
          title="Use the shadcn MCP"
          lead="Then ask for “add @drift-ui/tags-input” or “search @drift-ui for a date picker”."
        >
          <CopyCommand
            command="npx shadcn@latest mcp init --client claude"
            className="w-full"
          />
        </AgentCard>
      </ul>
    </section>
  )
}
