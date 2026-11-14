import { PreviewTabs } from "@/components/docs/preview-tabs"
import type { LoadedExample } from "@/lib/component-docs"

export function ComponentExamples({
  src,
  examples,
}: {
  src: string
  examples: LoadedExample[]
}) {
  return (
    <div className="flex flex-col gap-14">
      {examples.map(({ id, title, description, Preview, code }) => (
        <div key={id} id={id} className="flex scroll-mt-32 flex-col gap-3">
          <h3 className="text-lg font-medium tracking-tight">
            <a
              href={`#${id}`}
              className="outline-none hover:underline hover:decoration-border hover:underline-offset-8 focus-visible:underline"
            >
              {title}
            </a>
          </h3>
          <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <PreviewTabs
            compact
            preview={<Preview />}
            code={{ src, title: code }}
          />
        </div>
      ))}
    </div>
  )
}
