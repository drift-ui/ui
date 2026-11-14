import { cn } from "@/registry/default/lib/utils"
import { SHOWCASE_STYLES, type ShowcaseStyle } from "@/lib/style-tokens"

export function StylePicker({
  value,
  onValueChange,
  className,
}: {
  value: ShowcaseStyle
  onValueChange: (style: ShowcaseStyle) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Style"
      className={cn("grid grid-cols-2 gap-1.5", className)}
    >
      {SHOWCASE_STYLES.map((style) => (
        <button
          key={style.id}
          type="button"
          aria-pressed={style.id === value.id}
          onClick={() => onValueChange(style)}
          className="flex flex-col gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-colors outline-none hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:border-foreground/60 aria-pressed:bg-accent"
        >
          <span className="text-sm font-medium">{style.label}</span>
          <span className="text-xs text-muted-foreground">
            {style.description}
          </span>
        </button>
      ))}
    </div>
  )
}
