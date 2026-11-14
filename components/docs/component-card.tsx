import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"

import { cn } from "@/registry/default/lib/utils"

export type CatalogCard = {
  slug: string
  name: string
  description: string
  category: string
  thumbnail: React.ReactNode
}

export function ComponentCard({
  card,
  className,
}: {
  card: CatalogCard
  className?: string
}) {
  return (
    <article className={cn("group relative flex flex-col gap-3", className)}>
      <div
        inert
        className="@container flex min-h-36 items-center overflow-hidden rounded-[1.75rem] border bg-[radial-gradient(80%_70%_at_50%_0%,color-mix(in_oklab,var(--foreground)_5%,transparent),transparent)] p-6 transition-[border-color,background-color] duration-300 select-none group-hover:border-foreground/20 group-hover:bg-muted/30"
      >
        {card.thumbnail}
      </div>
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-medium">
            <Link
              href={`/components/${card.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
            >
              {card.name}
            </Link>
          </h3>
          <ArrowUpRightIcon className="size-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-[opacity,translate] duration-300 group-hover:translate-0 group-hover:opacity-100" />
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {card.description}
        </p>
      </div>
    </article>
  )
}
