export interface HistogramBucket {
  index: number
  start: number
  end: number
  count: number
  heightPercent: number
  inRange: boolean
}

export interface BuildHistogramBucketsOptions {
  data?: number[]
  min?: number
  max?: number
  bins?: number
  value?: [number, number]
}

export interface BuildHistogramBucketsResult {
  buckets: HistogramBucket[]
  min: number
  max: number
  bins: number
  totalCount: number
  selectedCount: number
  maxBucketCount: number
}

/**
 * Checks whether a histogram bucket overlaps the active range [rangeMin, rangeMax].
 */
export function isBucketInRange(
  bucketStart: number,
  bucketEnd: number,
  rangeMin: number,
  rangeMax: number
): boolean {
  if (rangeMin === rangeMax) {
    return rangeMin >= bucketStart && rangeMin <= bucketEnd
  }
  return bucketEnd > rangeMin && bucketStart < rangeMax
}

/**
 * Clamps and orders a two-value range to [min, max].
 */
export function clampRange(
  value: [number, number] | undefined,
  min: number,
  max: number
): [number, number] {
  if (!value || !Array.isArray(value) || value.length < 2) {
    return [min, max]
  }
  const low = Math.max(min, Math.min(max, Math.min(value[0], value[1])))
  const high = Math.max(min, Math.min(max, Math.max(value[0], value[1])))
  return [low, high]
}

/**
 * Groups numeric data into discrete histogram buckets across [min, max]
 * and evaluates height percentages and range selection state.
 *
 * Values equal to `max` land strictly in the last bucket.
 */
export function buildHistogramBuckets({
  data = [],
  min: minProp,
  max: maxProp,
  bins: binsProp = 24,
  value,
}: BuildHistogramBucketsOptions): BuildHistogramBucketsResult {
  const bins = Math.max(1, Math.floor(binsProp))

  // Filter valid numbers
  const validNumbers: number[] = []
  for (const item of data) {
    if (typeof item === "number" && Number.isFinite(item)) {
      validNumbers.push(item)
    }
  }

  // Determine min and max
  let min = minProp
  let max = maxProp

  if (min === undefined) {
    min = validNumbers.length > 0 ? Math.min(...validNumbers) : 0
  }
  if (max === undefined) {
    max = validNumbers.length > 0 ? Math.max(...validNumbers) : 100
  }

  // Safety fallback if min >= max
  if (min >= max) {
    max = min + 1
  }

  const range = clampRange(value, min, max)
  const stepSize = (max - min) / bins

  const counts = new Array<number>(bins).fill(0)
  let totalCount = 0
  let selectedCount = 0

  for (const val of validNumbers) {
    if (val < min || val > max) continue
    totalCount++

    if (val >= range[0] && val <= range[1]) {
      selectedCount++
    }

    if (val === max) {
      counts[bins - 1]++
    } else {
      const idx = Math.floor((val - min) / stepSize)
      const clampedIdx = Math.max(0, Math.min(bins - 1, idx))
      counts[clampedIdx]++
    }
  }

  const maxBucketCount = Math.max(0, ...counts)

  const buckets: HistogramBucket[] = []
  for (let i = 0; i < bins; i++) {
    const bucketStart = min + i * stepSize
    const bucketEnd = i === bins - 1 ? max : min + (i + 1) * stepSize
    const count = counts[i]

    let heightPercent = 0
    if (maxBucketCount > 0 && count > 0) {
      heightPercent = Math.max(8, Math.round((count / maxBucketCount) * 100))
    }

    const inRange = isBucketInRange(bucketStart, bucketEnd, range[0], range[1])

    buckets.push({
      index: i,
      start: bucketStart,
      end: bucketEnd,
      count,
      heightPercent,
      inRange,
    })
  }

  return {
    buckets,
    min,
    max,
    bins,
    totalCount,
    selectedCount,
    maxBucketCount,
  }
}
