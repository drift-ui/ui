import { describe, expect, it } from "vitest"

import {
  getConflictAnnouncement,
  getFieldDiff,
  getMergedRecord,
  getUnresolvedCount,
  isAllResolved,
  isFieldConflict,
  isFieldResolved,
  resolveAll,
  type MergeField,
  type MergeFieldResolution,
  type MergeResolutions,
} from "@/registry/default/lib/merge-resolver-utils"

const SAMPLE_FIELDS: MergeField[] = [
  {
    name: "title",
    label: "Title",
    ours: "Draft Document",
    theirs: "Final Document",
  },
  {
    name: "status",
    label: "Status",
    ours: "published",
    theirs: "published",
  },
  {
    name: "content",
    label: "Content",
    ours: "Hello world from client",
    theirs: "Hello world from server",
  },
]

describe("isFieldConflict", () => {
  it("detects conflict when ours and theirs differ", () => {
    expect(isFieldConflict(SAMPLE_FIELDS[0])).toBe(true)
  })

  it("detects no conflict when ours and theirs match", () => {
    expect(isFieldConflict(SAMPLE_FIELDS[1])).toBe(false)
  })
})

describe("getFieldDiff", () => {
  it("handles identical non-empty text", () => {
    const diff = getFieldDiff("hello world", "hello world")
    expect(diff.identical).toBe(true)
    expect(diff.oursSegments).toEqual([{ text: "hello world", changed: false }])
    expect(diff.theirsSegments).toEqual([
      { text: "hello world", changed: false },
    ])
  })

  it("handles identical empty text", () => {
    const diff = getFieldDiff("", "")
    expect(diff.identical).toBe(true)
    expect(diff.oursSegments).toEqual([])
    expect(diff.theirsSegments).toEqual([])
  })

  it("computes word-level diffs with shared words", () => {
    const diff = getFieldDiff(
      "Hello world from client",
      "Hello world from server"
    )
    expect(diff.identical).toBe(false)
    const oursChanged = diff.oursSegments
      .filter((s) => s.changed)
      .map((s) => s.text)
    const theirsChanged = diff.theirsSegments
      .filter((s) => s.changed)
      .map((s) => s.text)
    expect(oursChanged).toEqual(["client"])
    expect(theirsChanged).toEqual(["server"])
  })

  it("handles completely disjoint text", () => {
    const diff = getFieldDiff("alpha", "beta")
    expect(diff.identical).toBe(false)
    expect(diff.oursSegments).toEqual([{ text: "alpha", changed: true }])
    expect(diff.theirsSegments).toEqual([{ text: "beta", changed: true }])
  })

  it("returns no segments for an empty side of a conflict", () => {
    expect(getFieldDiff("", "beta").oursSegments).toEqual([])
    expect(getFieldDiff("alpha", "").theirsSegments).toEqual([])
  })
})

describe("isFieldResolved", () => {
  it("returns false for undefined", () => {
    expect(isFieldResolved(undefined)).toBe(false)
  })

  it("returns true for ours choice", () => {
    expect(isFieldResolved({ choice: "ours" })).toBe(true)
  })

  it("returns true for theirs choice", () => {
    expect(isFieldResolved({ choice: "theirs" })).toBe(true)
  })

  it("returns true for custom choice with string value", () => {
    expect(
      isFieldResolved({ choice: "custom", customValue: "Resolved text" })
    ).toBe(true)
    expect(isFieldResolved({ choice: "custom", customValue: "" })).toBe(true)
  })

  it("returns false for custom choice without customValue", () => {
    expect(isFieldResolved({ choice: "custom" })).toBe(false)
  })

  it("returns false for an unknown choice", () => {
    expect(
      isFieldResolved({ choice: "base" } as unknown as MergeFieldResolution)
    ).toBe(false)
  })
})

describe("getUnresolvedCount and isAllResolved", () => {
  it("counts unresolved conflicting fields, ignoring identical ones", () => {
    const resolutions: MergeResolutions = {}
    expect(getUnresolvedCount(SAMPLE_FIELDS, resolutions)).toBe(2)
    expect(isAllResolved(SAMPLE_FIELDS, resolutions)).toBe(false)
  })

  it("updates count when partial resolutions exist", () => {
    const resolutions: MergeResolutions = {
      title: { choice: "ours" },
    }
    expect(getUnresolvedCount(SAMPLE_FIELDS, resolutions)).toBe(1)
    expect(isAllResolved(SAMPLE_FIELDS, resolutions)).toBe(false)
  })

  it("returns 0 and true when all conflicting fields are resolved", () => {
    const resolutions: MergeResolutions = {
      title: { choice: "ours" },
      content: { choice: "custom", customValue: "Hello world merged" },
    }
    expect(getUnresolvedCount(SAMPLE_FIELDS, resolutions)).toBe(0)
    expect(isAllResolved(SAMPLE_FIELDS, resolutions)).toBe(true)
  })
})

describe("getMergedRecord", () => {
  it("builds the record according to chosen resolutions", () => {
    const resolutions: MergeResolutions = {
      title: { choice: "theirs" },
      content: { choice: "custom", customValue: "Combined content" },
    }
    const merged = getMergedRecord(SAMPLE_FIELDS, resolutions)
    expect(merged).toEqual({
      title: "Final Document",
      status: "published",
      content: "Combined content",
    })
  })

  it("defaults unresolved or identical fields to ours", () => {
    const merged = getMergedRecord(SAMPLE_FIELDS, {})
    expect(merged).toEqual({
      title: "Draft Document",
      status: "published",
      content: "Hello world from client",
    })
  })

  it("ignores stored resolutions when a field is not conflicting", () => {
    const resolutions: MergeResolutions = {
      status: { choice: "custom", customValue: "draft" },
    }
    const merged = getMergedRecord(SAMPLE_FIELDS, resolutions)
    expect(merged.status).toBe("published")
  })

  it("uses an empty string for a custom choice without a value", () => {
    const merged = getMergedRecord(SAMPLE_FIELDS, {
      title: { choice: "custom" },
    })
    expect(merged.title).toBe("")
  })

  it("safely handles __proto__ as a field name", () => {
    const fields: MergeField[] = [
      {
        name: "__proto__",
        ours: "custom-proto-ours",
        theirs: "custom-proto-theirs",
      },
    ]
    const merged = getMergedRecord(fields, {
      ["__proto__"]: { choice: "theirs" },
    })
    expect(Object.hasOwn(merged, "__proto__")).toBe(true)
    expect(merged["__proto__"]).toBe("custom-proto-theirs")
  })
})

describe("resolveAll", () => {
  it("resolves all conflicting fields to ours", () => {
    const resolutions = resolveAll(SAMPLE_FIELDS, "ours")
    expect(resolutions).toEqual({
      title: { choice: "ours" },
      content: { choice: "ours" },
    })
  })

  it("resolves all conflicting fields to theirs, preserving existing non-conflicting", () => {
    const resolutions = resolveAll(SAMPLE_FIELDS, "theirs", {
      status: { choice: "ours" },
    })
    expect(resolutions).toEqual({
      status: { choice: "ours" },
      title: { choice: "theirs" },
      content: { choice: "theirs" },
    })
  })

  it("safely handles __proto__ in resolveAll", () => {
    const fields: MergeField[] = [
      {
        name: "__proto__",
        ours: "a",
        theirs: "b",
      },
    ]
    const resolutions = resolveAll(fields, "ours")
    expect(Object.hasOwn(resolutions, "__proto__")).toBe(true)
    expect(resolutions["__proto__"]).toEqual({ choice: "ours" })
  })
})

describe("getConflictAnnouncement", () => {
  it("returns correct messages for 0, 1, and many conflicts", () => {
    expect(getConflictAnnouncement(0)).toBe("All conflicts resolved")
    expect(getConflictAnnouncement(1)).toBe("1 unresolved conflict remaining")
    expect(getConflictAnnouncement(5)).toBe("5 unresolved conflicts remaining")
  })
})
