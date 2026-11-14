import { describe, expect, it } from "vitest"

import {
  filterOptions,
  groupOptions,
  toggleAll,
  toggleValue,
} from "@/registry/default/lib/multi-select-utils"

const OPTIONS = [
  { value: "eu-west-1", label: "Ireland", group: "Europe" },
  { value: "us-east-1", label: "Virginia", group: "Americas" },
  { value: "eu-central-1", label: "Frankfurt", group: "Europe" },
  { value: "global", label: "Global" },
]

describe("multi-select", () => {
  it("filters on label and value, ignoring case and outer spaces", () => {
    expect(filterOptions(OPTIONS, " FRANK ").map((o) => o.value)).toEqual([
      "eu-central-1",
    ])
    expect(filterOptions(OPTIONS, "eu-").map((o) => o.label)).toEqual([
      "Ireland",
      "Frankfurt",
    ])
    expect(filterOptions(OPTIONS, "")).toBe(OPTIONS)
  })

  it("groups options in order of first appearance", () => {
    expect(
      groupOptions(OPTIONS).map((group) => [
        group.label,
        group.options.map((option) => option.label),
      ])
    ).toEqual([
      ["Europe", ["Ireland", "Frankfurt"]],
      ["Americas", ["Virginia"]],
      [undefined, ["Global"]],
    ])
  })

  it("toggles a value and respects the maximum", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"])
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"])
    const full = ["a", "b"]
    expect(toggleValue(full, "c", 2)).toBe(full)
    expect(toggleValue(full, "b", 2)).toEqual(["a"])
  })

  it("selects every option, or clears them when all are selected", () => {
    const pair = OPTIONS.slice(0, 2)
    expect(toggleAll(["global", "eu-west-1"], pair)).toEqual([
      "global",
      "eu-west-1",
      "us-east-1",
    ])
    expect(toggleAll(["global", "eu-west-1", "us-east-1"], pair)).toEqual([
      "global",
    ])
  })
})
