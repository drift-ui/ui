import { describe, expect, it } from "vitest"

import {
  BINARY_BYTE_UNITS,
  BYTE_UNITS,
  bestUnit,
  clampValue,
  findUnit,
  formatAmount,
  fromBase,
  parseUnitText,
  toBase,
} from "@/registry/default/lib/unit-input-utils"

const MB = BYTE_UNITS[2]
const GB = BYTE_UNITS[3]
const MIB = BINARY_BYTE_UNITS[2]

describe("unit-input logic", () => {
  it("converts to and from the base unit without float noise", () => {
    expect(toBase(512, MB)).toBe(512_000_000)
    expect(fromBase(512_000_000, GB)).toBe(0.512)
    expect(toBase(0.1 * 3, GB)).toBe(300_000_000)
    expect(toBase(1, MIB)).toBe(1_048_576)
  })

  it("keeps large integer base values exact", () => {
    expect(fromBase(1_234_567_890_123, BYTE_UNITS[0])).toBe(1_234_567_890_123)
    expect(toBase(1_234_567_890_123, BYTE_UNITS[0])).toBe(1_234_567_890_123)
    expect(toBase(1.1, GB)).toBe(1_100_000_000)
  })

  it("finds units by id or label, exact match first", () => {
    const units = [
      { id: "Mb", label: "Mb", factor: 125_000 },
      { id: "MB", label: "MB", factor: 1e6 },
    ]
    expect(findUnit(units, "MB")?.factor).toBe(1e6)
    expect(findUnit(units, "Mb")?.factor).toBe(125_000)
    expect(findUnit(BYTE_UNITS, "gb")).toBe(GB)
    expect(findUnit(BYTE_UNITS, "XB")).toBeUndefined()
  })

  it("parses numbers with or without a unit", () => {
    expect(parseUnitText("2gb", BYTE_UNITS)).toEqual({ amount: 2, unit: GB })
    expect(parseUnitText(" 512 MiB ", BINARY_BYTE_UNITS)).toEqual({
      amount: 512,
      unit: MIB,
    })
    expect(parseUnitText("1,024", BYTE_UNITS)).toEqual({ amount: 1024 })
    expect(parseUnitText(".5", BYTE_UNITS)).toEqual({ amount: 0.5 })
    expect(parseUnitText("-3", BYTE_UNITS)).toEqual({ amount: -3 })
  })

  it("rejects unknown units and text that is not a number", () => {
    expect(parseUnitText("2 XB", BYTE_UNITS)).toBeNull()
    expect(parseUnitText("abc", BYTE_UNITS)).toBeNull()
    expect(parseUnitText("1.2.3", BYTE_UNITS)).toBeNull()
    expect(parseUnitText("", BYTE_UNITS)).toBeNull()
    expect(parseUnitText("1,2", BYTE_UNITS)).toBeNull()
    expect(parseUnitText("12,34", BYTE_UNITS)).toBeNull()
    expect(parseUnitText("1,234,56", BYTE_UNITS)).toBeNull()
  })

  it("accepts three-digit comma groups", () => {
    expect(parseUnitText("1,234,567.5 MB", BYTE_UNITS)).toEqual({
      amount: 1_234_567.5,
      unit: MB,
    })
  })

  it("rejects integers past the safe range", () => {
    expect(parseUnitText("9007199254740993", BYTE_UNITS)).toBeNull()
    expect(parseUnitText("9007199254740991", BYTE_UNITS)).toEqual({
      amount: Number.MAX_SAFE_INTEGER,
    })
  })

  it("picks the largest unit that keeps the number at 1 or more", () => {
    expect(bestUnit(512_000_000, BYTE_UNITS)).toBe(MB)
    expect(bestUnit(2_000_000_000, BYTE_UNITS)).toBe(GB)
    expect(bestUnit(null, BYTE_UNITS)).toBe(BYTE_UNITS[0])
    expect(bestUnit(0, BYTE_UNITS)).toBe(BYTE_UNITS[0])
  })

  it("clamps and formats", () => {
    expect(clampValue(5, 10, 20)).toBe(10)
    expect(clampValue(25, 10, 20)).toBe(20)
    expect(clampValue(15)).toBe(15)
    expect(formatAmount(0.5)).toBe("0.5")
    expect(formatAmount(1_000_000)).toBe("1000000")
    expect(formatAmount(1 / 3)).toBe("0.333333")
    expect(formatAmount(1e-9)).toBe("0.000000001")
    expect(formatAmount(1_234_567_890_123)).toBe("1234567890123")
  })
})
