export type UsageMeterStatus = "normal" | "warning" | "danger"

export interface UsageMeterSegment {
  id?: string
  label: string
  value: number
  color?: string
}

export interface CalculatedSegment extends UsageMeterSegment {
  percentage: number
  share: number
  color: string
}

export const DEFAULT_SEGMENT_COLORS: readonly string[] = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]

export interface MeterStatusOptions {
  value: number
  max: number
  min?: number
  warningAt?: number
  dangerAt?: number
}

export function resolveThreshold(
  threshold: number | undefined,
  max: number,
  defaultRatio: number,
  min = 0
): number {
  const safeMin = Math.max(0, min)
  const safeMax = Math.max(safeMin, max)
  const range = safeMax - safeMin
  if (threshold === undefined) return safeMin + range * defaultRatio
  return threshold <= 1 && threshold >= 0
    ? safeMin + range * threshold
    : threshold
}

export function calculateMeterStatus({
  value,
  max,
  min = 0,
  warningAt = 0.8,
  dangerAt = 1.0,
}: MeterStatusOptions): UsageMeterStatus {
  const safeMin = Math.max(0, min)
  const safeMax = Math.max(safeMin, max)
  if (safeMax <= safeMin) return value > safeMin ? "danger" : "normal"
  const warningValue = resolveThreshold(warningAt, safeMax, 0.8, safeMin)
  const dangerValue = resolveThreshold(dangerAt, safeMax, 1.0, safeMin)

  if (value > dangerValue) {
    return "danger"
  }
  if (value >= warningValue) {
    return "warning"
  }
  return "normal"
}

export function calculatePercentage(
  value: number,
  max: number,
  decimals = 1,
  min = 0
): number {
  const safeMin = Math.max(0, min)
  const safeMax = Math.max(safeMin, max)
  const range = safeMax - safeMin
  if (range <= 0) return value >= safeMax ? 100 : 0
  const ratio = ((value - safeMin) / range) * 100
  const factor = 10 ** decimals
  return Math.round(ratio * factor) / factor
}

export function calculateSegments(
  segments: readonly UsageMeterSegment[],
  max: number,
  colors: readonly string[] = DEFAULT_SEGMENT_COLORS,
  min = 0
): CalculatedSegment[] {
  const safeMin = Math.max(0, min)
  const safeMax = Math.max(safeMin, max)
  const range = safeMax - safeMin
  const palette = colors && colors.length > 0 ? colors : DEFAULT_SEGMENT_COLORS
  const total = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0)

  return segments.map((seg, idx) => {
    const val = Math.max(0, seg.value)
    const percentage =
      range > 0 ? calculatePercentage(val, safeMax, 2, safeMin) : 0
    const share = total > 0 ? calculatePercentage(val, total, 2, 0) : 0
    const color = seg.color ?? palette[idx % palette.length]

    return {
      ...seg,
      value: val,
      percentage,
      share,
      color,
    }
  })
}

export interface FormatUsageOptions {
  unit?: string
  locale?: string
  formatOptions?: Intl.NumberFormatOptions
  decimals?: number
}

export function formatUsageValue(
  value: number,
  options: FormatUsageOptions = {}
): string {
  const { unit, locale = "en-US", formatOptions, decimals } = options

  const opts: Intl.NumberFormatOptions = {
    ...formatOptions,
  }

  if (decimals !== undefined && opts.maximumFractionDigits === undefined) {
    opts.minimumFractionDigits = decimals
    opts.maximumFractionDigits = decimals
  }

  const formattedNum = new Intl.NumberFormat(locale, opts).format(value)

  if (!unit) {
    return formattedNum
  }

  if (unit === "%") {
    return `${formattedNum}%`
  }

  return `${formattedNum} ${unit}`
}

export interface AriaValueTextOptions {
  value: number
  max: number
  min?: number
  unit?: string
  locale?: string
  formatOptions?: Intl.NumberFormatOptions
  decimals?: number
}

export function getUsageAriaValueText({
  value,
  max,
  min = 0,
  unit,
  locale = "en-US",
  formatOptions,
  decimals,
}: AriaValueTextOptions): string {
  const safeMin = Math.max(0, min)
  const safeMax = Math.max(safeMin, max)
  const formattedVal = formatUsageValue(value, {
    unit,
    locale,
    decimals,
    formatOptions,
  })
  const formattedMax = formatUsageValue(safeMax, {
    unit,
    locale,
    decimals,
    formatOptions,
  })
  const percentage = calculatePercentage(value, safeMax, 0, safeMin)

  if (value > safeMax) {
    const overage = value - safeMax
    const formattedOverage = formatUsageValue(overage, {
      unit,
      locale,
      decimals,
      formatOptions,
    })
    return `${formattedVal} of ${formattedMax}, ${percentage}% (${formattedOverage} over limit)`
  }

  return `${formattedVal} of ${formattedMax}, ${percentage}%`
}
