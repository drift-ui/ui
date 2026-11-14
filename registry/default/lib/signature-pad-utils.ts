export type SignaturePoint = [x: number, y: number]
export type SignatureStroke = SignaturePoint[]
export type SignatureInk = SignatureStroke[] | string
export type SignatureFormat = "svg" | "png"

export const PAD_WIDTH = 600
export const PAD_HEIGHT = 200
export const PEN_WIDTH = 2.5
export const SIGNATURE_BASELINE = 150

const PNG_SCALE = 2
const NAME_MAX_FONT_SIZE = 56
const NAME_MAX_WIDTH = 560
const NAME_GLYPH_WIDTH = 0.55

function round(value: number) {
  return Math.round(value * 10) / 10
}

function escapeXml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

export function nameFontSize(name: string) {
  return Math.min(
    NAME_MAX_FONT_SIZE,
    round(NAME_MAX_WIDTH / (name.length * NAME_GLYPH_WIDTH))
  )
}

export function strokeToPath(stroke: SignatureStroke) {
  const [[startX, startY], ...rest] = stroke
  const start = `M${round(startX)} ${round(startY)}`
  if (rest.length === 0) return `${start}l.01 0`

  const curves = rest.slice(0, -1).map(([x, y], index) => {
    const [nextX, nextY] = rest[index + 1]
    return `Q${round(x)} ${round(y)} ${round((x + nextX) / 2)} ${round((y + nextY) / 2)}`
  })
  const [endX, endY] = rest[rest.length - 1]

  return `${start}${curves.join("")}L${round(endX)} ${round(endY)}`
}

function inkToSvg(ink: SignatureInk, color: string) {
  const paint = escapeXml(color)
  const body =
    typeof ink === "string"
      ? `<text x="${PAD_WIDTH / 2}" y="${SIGNATURE_BASELINE}" text-anchor="middle" font-family="cursive" font-style="italic" font-size="${nameFontSize(ink)}" fill="${paint}">${escapeXml(ink)}</text>`
      : `<g fill="none" stroke="${paint}" stroke-width="${PEN_WIDTH}" stroke-linecap="round" stroke-linejoin="round">${ink
          .map((stroke) => `<path d="${strokeToPath(stroke)}"/>`)
          .join("")}</g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAD_WIDTH}" height="${PAD_HEIGHT}" viewBox="0 0 ${PAD_WIDTH} ${PAD_HEIGHT}">${body}</svg>`
}

function inkToPng(ink: SignatureInk, color: string) {
  const canvas = document.createElement("canvas")
  canvas.width = PAD_WIDTH * PNG_SCALE
  canvas.height = PAD_HEIGHT * PNG_SCALE

  const context = canvas.getContext("2d")!
  context.scale(PNG_SCALE, PNG_SCALE)
  context.fillStyle = color
  context.strokeStyle = color
  context.lineWidth = PEN_WIDTH
  context.lineCap = "round"
  context.lineJoin = "round"

  if (typeof ink === "string") {
    context.font = `italic ${nameFontSize(ink)}px cursive`
    context.textAlign = "center"
    context.fillText(ink, PAD_WIDTH / 2, SIGNATURE_BASELINE)
  } else {
    for (const stroke of ink) {
      context.stroke(new Path2D(strokeToPath(stroke)))
    }
  }

  return canvas.toDataURL("image/png")
}

export function exportSignature(
  ink: SignatureInk,
  format: SignatureFormat,
  color: string
) {
  if (ink.length === 0) return ""
  return format === "png" ? inkToPng(ink, color) : inkToSvg(ink, color)
}

export function signatureImageSrc(value: string) {
  return value.startsWith("data:")
    ? value
    : `data:image/svg+xml,${encodeURIComponent(value)}`
}
