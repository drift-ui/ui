import type { Element, ElementContent } from "hast"
import {
  createHighlighter,
  type Highlighter,
  type ShikiTransformer,
} from "shiki"

const LIGHT = "github-light-default"
const DARK = "github-dark-default"

type Palette = {
  classes: Map<string, string>
  defaults: Set<string>
  css: string
}

let highlighter: Promise<Highlighter> | undefined
let palette: Palette | undefined

function getHighlighter() {
  highlighter ??= createHighlighter({
    themes: [LIGHT, DARK],
    langs: ["tsx", "bash"],
  })
  return highlighter
}

function buildPalette(instance: Highlighter): Palette {
  const classes = new Map<string, string>()
  const defaults = new Set<string>()
  const rules: string[] = []

  for (const [variable, prefix, name] of [
    ["--shiki-light", "sl", LIGHT],
    ["--shiki-dark", "sd", DARK],
  ] as const) {
    const theme = instance.getTheme(name)
    const colors = new Set(
      [theme.fg, ...theme.settings.map((s) => s.settings?.foreground)]
        .filter((color): color is string => Boolean(color))
        .map((color) => color.toLowerCase())
    )
    defaults.add(`${variable}:${theme.fg.toLowerCase()}`)
    ;[...colors].forEach((color, index) => {
      classes.set(`${variable}:${color}`, `${prefix}${index}`)
      rules.push(`.${prefix}${index}{${variable}:${color}}`)
    })
  }

  const inlineDefaults = [...defaults].join(";")
  rules.push(`.code-inline{${inlineDefaults}}`)

  return { classes, defaults, css: rules.join("") }
}

async function getPalette() {
  const instance = await getHighlighter()
  palette ??= buildPalette(instance)
  return { instance, palette }
}

function isToken(node: Element) {
  return node.tagName === "span" && typeof node.properties.style === "string"
}

function compactToken(node: Element, { classes, defaults }: Palette) {
  const kept: string[] = []
  const classNames: string[] = []

  for (const declaration of String(node.properties.style).split(";")) {
    const [variable, value = ""] = declaration.split(":")
    if (variable !== "--shiki-light" && variable !== "--shiki-dark") continue
    const key = `${variable}:${value.toLowerCase()}`
    if (defaults.has(key)) continue
    const className = classes.get(key)
    if (className) classNames.push(className)
    else kept.push(declaration)
  }

  delete node.properties.style
  if (kept.length > 0) node.properties.style = kept.join(";")
  if (classNames.length > 0) node.properties.className = classNames
}

function compactChildren(
  children: ElementContent[],
  colors: Palette
): ElementContent[] {
  return children.flatMap((child) => {
    if (child.type !== "element") return [child]
    if (!isToken(child)) {
      child.children = compactChildren(child.children, colors)
      return [child]
    }
    compactToken(child, colors)
    const isPlain =
      child.properties.style === undefined &&
      child.properties.className === undefined
    return isPlain ? child.children : [child]
  })
}

function compactTokens(colors: Palette): ShikiTransformer {
  return {
    root(node) {
      node.children = compactChildren(
        node.children.filter(
          (child): child is ElementContent => child.type !== "doctype"
        ),
        colors
      )
    },
  }
}

const THEMES = {
  themes: { light: LIGHT, dark: DARK },
  defaultColor: false,
} as const

export async function codeTokenCss() {
  return (await getPalette()).palette.css
}

export async function highlight(code: string, lang: "tsx" | "bash" = "tsx") {
  const { instance, palette } = await getPalette()

  return instance.codeToHtml(code, {
    ...THEMES,
    lang,
    transformers: [compactTokens(palette)],
  })
}

export async function highlightFile(
  title: string,
  code: string,
  lang: "tsx" | "bash" = "tsx"
) {
  return {
    title,
    html: await highlight(code, lang),
    lines: code.split("\n").length,
  }
}

export type HighlightedFile = Awaited<ReturnType<typeof highlightFile>>

export async function highlightInline(code: string) {
  const { instance, palette } = await getPalette()

  return instance.codeToHtml(code, {
    ...THEMES,
    lang: "tsx",
    structure: "inline",
    transformers: [compactTokens(palette)],
  })
}

export async function highlightType(code: string) {
  const { instance, palette } = await getPalette()

  return instance.codeToHtml(code, {
    ...THEMES,
    lang: "tsx",
    structure: "inline",
    grammarContextCode: "type T = ",
    transformers: [compactTokens(palette)],
  })
}
