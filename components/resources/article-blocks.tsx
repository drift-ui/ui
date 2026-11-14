import { InfoIcon } from "lucide-react"

import { CodeFrame } from "@/components/docs/code-frame"
import { highlightFile } from "@/lib/highlight"

export async function Commands({ code }: { code: string }) {
  return <CodeFrame {...await highlightFile("Terminal", code, "bash")} />
}

export async function CodeSample({
  title,
  code,
}: {
  title: string
  code: string
}) {
  return <CodeFrame {...await highlightFile(title, code)} />
}

export function StepList({ children }: { children: React.ReactNode }) {
  return <ol className="mt-2 [counter-reset:step]">{children}</ol>
}

export function Step({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="relative flex min-w-0 flex-col gap-3 pb-9 pl-12 [counter-increment:step] before:absolute before:top-0.5 before:left-0 before:flex before:size-7 before:items-center before:justify-center before:rounded-full before:border before:bg-background before:font-mono before:text-xs before:text-muted-foreground before:content-[counter(step)] after:absolute after:top-10 after:bottom-1 after:left-3.5 after:w-px after:bg-border last:pb-0 last:after:hidden">
      <h3 className="leading-8 font-medium text-foreground">{title}</h3>
      {children}
    </li>
  )
}

export function Table({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="overflow-x-auto rounded-2xl border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_tbody_tr]:border-t [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_th]:text-foreground"
    >
      <table className="w-full min-w-xl text-left text-sm leading-6">
        {children}
      </table>
    </div>
  )
}

export function Tldr({ items }: { items: string[] }) {
  return (
    <section
      aria-labelledby="tldr"
      className="flex flex-col gap-3 rounded-2xl border bg-card p-5 text-card-foreground md:p-6"
    >
      <h2
        id="tldr"
        className="font-mono text-xs tracking-widest text-brand uppercase"
      >
        TL;DR
      </h2>
      <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed marker:text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export function Callout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <aside className="flex gap-3 rounded-2xl border bg-card p-5 text-base leading-relaxed text-card-foreground">
      <InfoIcon aria-hidden className="mt-1 size-4 shrink-0 text-brand" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </aside>
  )
}
