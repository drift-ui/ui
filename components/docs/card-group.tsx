import {
  ComponentCard,
  type CatalogCard,
} from "@/components/docs/component-card"

export function CardGroup({
  id,
  label,
  description,
  cards,
  visibleSlugs,
}: {
  id: string
  label: string
  description: string
  cards: CatalogCard[]
  visibleSlugs: Set<string>
}) {
  const visibleCount = cards.filter(({ slug }) => visibleSlugs.has(slug)).length

  return (
    <section
      hidden={visibleCount === 0}
      aria-labelledby={`group-${id}`}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
        <div className="flex items-baseline gap-3">
          <h2 id={`group-${id}`} className="text-xl font-medium tracking-tight">
            {label}
          </h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {visibleCount}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ul className="gap-x-5 md:columns-2 xl:columns-3">
        {cards.map((card) => (
          <li
            key={card.slug}
            hidden={!visibleSlugs.has(card.slug)}
            className="mb-8 break-inside-avoid"
          >
            <ComponentCard card={card} />
          </li>
        ))}
      </ul>
    </section>
  )
}
