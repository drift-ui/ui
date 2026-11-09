import { cn } from "@/registry/default/lib/utils"
import { BlockPreview } from "@/components/landing/block-preview"
import type { BlockKind } from "@/lib/blocks"

export function BlockStage({
  kind,
  className,
}: {
  kind: BlockKind
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-[26rem] items-end justify-center overflow-hidden rounded-2xl border bg-[radial-gradient(80%_70%_at_50%_0%,color-mix(in_oklab,var(--brand)_10%,transparent),transparent)] px-6 pt-10 md:px-10",
        className
      )}
    >
      <div
        aria-hidden
        inert
        data-theme-scope
        className="@container w-full max-w-lg rounded-t-xl border border-b-0 bg-card p-5 shadow-[0_-24px_48px_-32px] shadow-black/15 dark:shadow-black"
      >
        <BlockPreview kind={kind} />
      </div>
    </div>
  )
}
