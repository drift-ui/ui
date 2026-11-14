export const STYLE_TOKENS = [
  "spacing-control",
  "spacing-control-sm",
  "spacing-card",
  "radius-control",
  "radius-box",
  "radius-card",
  "radius-dialog",
  "shadow-control",
  "shadow-card",
] as const

export type StyleToken = (typeof STYLE_TOKENS)[number]

export type ShowcaseStyle = {
  id: string
  label: string
  description: string
  tokens: Record<StyleToken, string>
}

const NO_SHADOW = "0 0 #0000"
const SQUARE = "0px"
const SHADOW_SM =
  "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
const SHADOW_MD =
  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"

export const SHOWCASE_STYLES: ShowcaseStyle[] = [
  {
    id: "vega",
    label: "Vega",
    description: "The classic shadcn/ui look",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 9)",
      "spacing-control-sm": "calc(var(--spacing) * 8)",
      "spacing-card": "calc(var(--spacing) * 6)",
      "radius-control": "var(--radius-md)",
      "radius-box": "var(--radius-md)",
      "radius-card": "var(--radius-xl)",
      "radius-dialog": "var(--radius-lg)",
      "shadow-control": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "shadow-card": SHADOW_SM,
    },
  },
  {
    id: "nova",
    label: "Nova",
    description: "Shorter controls and tighter cards",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 8)",
      "spacing-control-sm": "calc(var(--spacing) * 7)",
      "spacing-card": "calc(var(--spacing) * 4)",
      "radius-control": "var(--radius-lg)",
      "radius-box": "var(--radius-lg)",
      "radius-card": "var(--radius-xl)",
      "radius-dialog": "var(--radius-xl)",
      "shadow-control": NO_SHADOW,
      "shadow-card": NO_SHADOW,
    },
  },
  {
    id: "maia",
    label: "Maia",
    description: "Pill controls and soft, round surfaces",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 9)",
      "spacing-control-sm": "calc(var(--spacing) * 8)",
      "spacing-card": "calc(var(--spacing) * 6)",
      "radius-control": "var(--radius-4xl)",
      "radius-box": "var(--radius-xl)",
      "radius-card": "var(--radius-2xl)",
      "radius-dialog": "var(--radius-4xl)",
      "shadow-control": NO_SHADOW,
      "shadow-card": NO_SHADOW,
    },
  },
  {
    id: "lyra",
    label: "Lyra",
    description: "Square corners and compact controls",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 8)",
      "spacing-control-sm": "calc(var(--spacing) * 7)",
      "spacing-card": "calc(var(--spacing) * 4)",
      "radius-control": SQUARE,
      "radius-box": SQUARE,
      "radius-card": SQUARE,
      "radius-dialog": SQUARE,
      "shadow-control": NO_SHADOW,
      "shadow-card": NO_SHADOW,
    },
  },
  {
    id: "mira",
    label: "Mira",
    description: "The densest style, with short controls",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 7)",
      "spacing-control-sm": "calc(var(--spacing) * 6)",
      "spacing-card": "calc(var(--spacing) * 4)",
      "radius-control": "var(--radius-md)",
      "radius-box": "var(--radius-md)",
      "radius-card": "var(--radius-lg)",
      "radius-dialog": "var(--radius-xl)",
      "shadow-control": NO_SHADOW,
      "shadow-card": NO_SHADOW,
    },
  },
  {
    id: "luma",
    label: "Luma",
    description: "Pill controls on deep, soft-shadowed cards",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 9)",
      "spacing-control-sm": "calc(var(--spacing) * 8)",
      "spacing-card": "calc(var(--spacing) * 6)",
      "radius-control": "var(--radius-4xl)",
      "radius-box": "var(--radius-2xl)",
      "radius-card": "var(--radius-4xl)",
      "radius-dialog": "var(--radius-4xl)",
      "shadow-control": NO_SHADOW,
      "shadow-card": SHADOW_MD,
    },
  },
  {
    id: "sera",
    label: "Sera",
    description: "Tall, square controls and roomy cards",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 10)",
      "spacing-control-sm": "calc(var(--spacing) * 9)",
      "spacing-card": "calc(var(--spacing) * 8)",
      "radius-control": SQUARE,
      "radius-box": SQUARE,
      "radius-card": SQUARE,
      "radius-dialog": SQUARE,
      "shadow-control": NO_SHADOW,
      "shadow-card": SHADOW_SM,
    },
  },
  {
    id: "rhea",
    label: "Rhea",
    description: "Rounded rectangles with a light card shadow",
    tokens: {
      "spacing-control": "calc(var(--spacing) * 8)",
      "spacing-control-sm": "calc(var(--spacing) * 7)",
      "spacing-card": "calc(var(--spacing) * 5)",
      "radius-control": "var(--radius-2xl)",
      "radius-box": "var(--radius-2xl)",
      "radius-card": "min(var(--radius-4xl), 24px)",
      "radius-dialog": "min(var(--radius-4xl), 24px)",
      "shadow-control": NO_SHADOW,
      "shadow-card": SHADOW_SM,
    },
  },
]

export const DEFAULT_STYLE = SHOWCASE_STYLES[0]

export function findStyle(id: string | null | undefined) {
  return SHOWCASE_STYLES.find((style) => style.id === id) ?? DEFAULT_STYLE
}

export function scopeStyleCss(style: ShowcaseStyle, scopeSelectors: string[]) {
  const declarations = STYLE_TOKENS.map(
    (token) => `  --drift-${token}: ${style.tokens[token]};`
  ).join("\n")

  return `${scopeSelectors.join(",\n")} {\n${declarations}\n}`
}
