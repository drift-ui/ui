import { describe, expect, it } from "vitest"

import {
  buildHistogramBuckets,
  clampRange,
  isBucketInRange,
} from "@/registry/default/lib/histogram-range"

describe("clampRange", () => {
  it("clamps and orders values within min and max", () => {
    expect(clampRange([10, 50], 0, 100)).toEqual([10, 50])
    expect(clampRange([80, 20], 0, 100)).toEqual([20, 80])
    expect(clampRange([-10, 150], 0, 100)).toEqual([0, 100])
  })

  it("handles undefined and invalid range input gracefully", () => {
    expect(clampRange(undefined, 0, 100)).toEqual([0, 100])
    expect(clampRange([] as unknown as [number, number], 0, 100)).toEqual([
      0, 100,
    ])
  })
})

describe("isBucketInRange", () => {
  it("detects range overlap correctly", () => {
    // Bucket [10, 20], range [15, 25] -> overlaps
    expect(isBucketInRange(10, 20, 15, 25)).toBe(true)
    // Bucket [10, 20], range [20, 30] -> non-overlapping boundary
    expect(isBucketInRange(10, 20, 20, 30)).toBe(false)
    // Bucket [10, 20], range [0, 10] -> non-overlapping boundary
    expect(isBucketInRange(10, 20, 0, 10)).toBe(false)
    // Bucket [10, 20], range [5, 25] -> completely contained
    expect(isBucketInRange(10, 20, 5, 25)).toBe(true)
  })

  it("handles point/degenerate ranges where min equals max", () => {
    expect(isBucketInRange(10, 20, 15, 15)).toBe(true)
    expect(isBucketInRange(10, 20, 10, 10)).toBe(true)
    // Non-last bucket [10, 20): upper boundary 20 is not included
    expect(isBucketInRange(10, 20, 20, 20, false)).toBe(false)
    // Next bucket [20, 30): lower boundary 20 is included
    expect(isBucketInRange(20, 30, 20, 20, false)).toBe(true)
    // Last bucket [80, 100]: upper boundary 100 IS included
    expect(isBucketInRange(80, 100, 100, 100, true)).toBe(true)
    expect(isBucketInRange(10, 20, 25, 25)).toBe(false)
  })
})

describe("buildHistogramBuckets", () => {
  it("places values equal to max in the last bucket", () => {
    const data = [0, 50, 100]
    const result = buildHistogramBuckets({
      data,
      min: 0,
      max: 100,
      bins: 5, // each bin is 20 wide: [0, 20), [20, 40), [40, 60), [60, 80), [80, 100]
      value: [0, 100],
    })

    expect(result.buckets).toHaveLength(5)
    // 0 is in bucket 0
    expect(result.buckets[0].count).toBe(1)
    // 50 is in bucket 2
    expect(result.buckets[2].count).toBe(1)
    // 100 MUST be in last bucket (index 4)
    expect(result.buckets[4].count).toBe(1)
    expect(result.totalCount).toBe(3)
    expect(result.selectedCount).toBe(3)
  })

  it("handles empty data and calculates fallback min/max", () => {
    const result = buildHistogramBuckets({
      data: [],
      bins: 10,
    })

    expect(result.buckets).toHaveLength(10)
    expect(result.totalCount).toBe(0)
    expect(result.selectedCount).toBe(0)
    expect(result.min).toBe(0)
    expect(result.max).toBe(100)
    for (const b of result.buckets) {
      expect(b.count).toBe(0)
      expect(b.heightPercent).toBe(0)
    }
  })

  it("calculates proportional heights with minimum height for non-empty bars", () => {
    // 50 items in bucket 1 (max bucket = 50 items -> 100%)
    // 1 item in bucket 5 (1 / 50 = 2% -> rounds below 8% floor -> receives 8%)
    // 10 items in bucket 8 (10 / 50 = 20%)
    const data = [...new Array(50).fill(15), 55, ...new Array(10).fill(85)]
    const result = buildHistogramBuckets({
      data,
      min: 0,
      max: 100,
      bins: 10,
    })

    const bucketMax = result.buckets[1] // [10, 20) contains 50 items
    const bucketSparse = result.buckets[5] // [50, 60) contains 1 item (2% -> 8% minimum)
    const bucketMedium = result.buckets[8] // [80, 90) contains 10 items (20%)

    expect(bucketMax.heightPercent).toBe(100)
    expect(bucketSparse.heightPercent).toBe(8)
    expect(bucketMedium.heightPercent).toBe(20)

    // Empty bucket
    expect(result.buckets[0].heightPercent).toBe(0)
  })

  it("filters values outside [min, max] and ignores non-finite values", () => {
    const data = [-50, NaN, Infinity, 25, 150]
    const result = buildHistogramBuckets({
      data,
      min: 0,
      max: 100,
      bins: 4,
    })

    expect(result.totalCount).toBe(1) // only 25 is valid and in range
    expect(result.buckets[1].count).toBe(1)
  })

  it("correctly identifies which buckets are inRange", () => {
    const data = [10, 30, 50, 70, 90]
    const result = buildHistogramBuckets({
      data,
      min: 0,
      max: 100,
      bins: 5, // [0,20), [20,40), [40,60), [60,80), [80,100]
      value: [25, 65],
    })

    // [0, 20) -> out of range
    expect(result.buckets[0].inRange).toBe(false)
    // [20, 40) -> overlaps [25, 65]
    expect(result.buckets[1].inRange).toBe(true)
    // [40, 60) -> overlaps [25, 65]
    expect(result.buckets[2].inRange).toBe(true)
    // [60, 80) -> overlaps [25, 65]
    expect(result.buckets[3].inRange).toBe(true)
    // [80, 100) -> out of range
    expect(result.buckets[4].inRange).toBe(false)

    // Selected count should be 30, 50, 70 (3 items)
    // Note: 70 is outside [25, 65] so data items: 30, 50 = 2 items
    expect(result.selectedCount).toBe(2)
  })

  it("infers min and max from data when omitted", () => {
    const data = [20, 40, 60, 80]
    const result = buildHistogramBuckets({
      data,
      bins: 4,
    })

    expect(result.min).toBe(20)
    expect(result.max).toBe(80)
  })

  it("handles min >= max by setting max to min + 1", () => {
    const result = buildHistogramBuckets({
      data: [50],
      min: 50,
      max: 50,
      bins: 5,
    })

    expect(result.min).toBe(50)
    expect(result.max).toBe(51)
    expect(result.buckets).toHaveLength(5)
  })

  it("handles very large datasets without call stack overflow", () => {
    const largeData = new Array(70000).fill(42)
    const result = buildHistogramBuckets({
      data: largeData,
      bins: 5,
    })
    expect(result.totalCount).toBe(70000)
    expect(result.buckets).toHaveLength(5)
  })
})
