import { describe, expect, it } from "vitest"

import {
  checkedStates,
  flattenTree,
  stepNode,
  toggleChecked,
  type TreeData,
} from "@/registry/default/lib/tree-view-utils"

const TREE: TreeData[] = [
  {
    id: "src",
    children: [
      { id: "src/a" },
      { id: "src/b" },
      { id: "src/lib", children: [{ id: "src/lib/x" }, { id: "src/lib/y" }] },
    ],
  },
  { id: "remote", isBranch: true },
  { id: "readme" },
]

function sorted(ids: string[]) {
  return [...ids].sort()
}

describe("flattenTree", () => {
  it("lists open branches with depth, parent and set position", () => {
    const rows = flattenTree(TREE, new Set(["src"]))

    expect(rows.map((row) => row.node.id)).toEqual([
      "src",
      "src/a",
      "src/b",
      "src/lib",
      "remote",
      "readme",
    ])
    expect(rows[3]).toMatchObject({
      depth: 1,
      parentId: "src",
      position: 3,
      siblingCount: 3,
      isBranch: true,
    })
  })

  it("adds a loading row under an open branch without children, and a failed row once it fails", () => {
    expect(flattenTree(TREE, new Set(["remote"]))[2]).toMatchObject({
      status: "loading",
      depth: 1,
    })
    expect(
      flattenTree(TREE, new Set(["remote"]), new Set(["remote"]))[2]
    ).toMatchObject({ status: "failed" })
  })

  it("flattens 10,000 open nodes", () => {
    const wide = Array.from({ length: 100 }, (_, branch) => ({
      id: `b${branch}`,
      children: Array.from({ length: 99 }, (_, leaf) => ({
        id: `b${branch}/${leaf}`,
      })),
    }))
    const rows = flattenTree(wide, new Set(wide.map((node) => node.id)))
    expect(rows).toHaveLength(10_000)
  })
})

describe("stepNode", () => {
  it("skips status rows and stops at the ends", () => {
    const rows = flattenTree(TREE, new Set(["remote"]))
    expect(stepNode(rows, 1, 1)).toBe(3)
    expect(stepNode(rows, 3, -1)).toBe(1)
    expect(stepNode(rows, 3, 1)).toBe(-1)
    expect(stepNode(rows, 0, -1)).toBe(-1)
  })
})

describe("checkedStates", () => {
  it("marks a branch mixed when some children are checked", () => {
    const states = checkedStates(TREE, new Set(["src/lib/x"]))
    expect(states.get("src/lib")).toBe("mixed")
    expect(states.get("src")).toBe("mixed")
    expect(states.get("src/a")).toBe(false)
  })

  it("marks a branch checked when every child is checked", () => {
    const states = checkedStates(TREE, new Set(["src/lib/x", "src/lib/y"]))
    expect(states.get("src/lib")).toBe(true)
  })

  it("passes a checked branch down to its children", () => {
    const states = checkedStates(TREE, new Set(["src"]))
    expect(states.get("src/lib/y")).toBe(true)
    expect(states.get("src")).toBe(true)
  })
})

describe("toggleChecked", () => {
  it("checks a branch and every descendant", () => {
    expect(sorted(toggleChecked(TREE, [], "src/lib"))).toEqual([
      "src/lib",
      "src/lib/x",
      "src/lib/y",
    ])
  })

  it("checks the parent once the last sibling is checked", () => {
    const next = toggleChecked(TREE, ["src/lib/x"], "src/lib/y")
    expect(next).toContain("src/lib")
    expect(checkedStates(TREE, new Set(next)).get("src")).toBe("mixed")
  })

  it("unchecks a child of a checked branch and keeps its siblings", () => {
    const next = toggleChecked(TREE, ["src"], "src/lib/x")
    expect(sorted(next)).toEqual(["src/a", "src/b", "src/lib/y"])
  })

  it("checks every child of a mixed branch", () => {
    const next = toggleChecked(TREE, ["src/a"], "src")
    expect(checkedStates(TREE, new Set(next)).get("src")).toBe(true)
  })

  it("leaves disabled nodes alone and still unchecks on the next toggle", () => {
    const tree: TreeData[] = [
      {
        id: "root",
        children: [{ id: "on" }, { id: "locked", disabled: true }],
      },
    ]
    const checked = toggleChecked(tree, [], "root")
    expect(checked).toEqual(["on"])
    expect(checkedStates(tree, new Set(checked)).get("root")).toBe("mixed")
    expect(toggleChecked(tree, checked, "root")).toEqual([])
    expect(toggleChecked(tree, [], "locked")).toEqual([])
  })

  it("keeps a lazily loaded child checked when its branch was checked first", () => {
    const loaded: TreeData[] = [
      { id: "remote", children: [{ id: "remote/1" }, { id: "remote/2" }] },
    ]
    expect(checkedStates(loaded, new Set(["remote"])).get("remote/2")).toBe(
      true
    )
    expect(toggleChecked(loaded, ["remote"], "remote/1")).toEqual(["remote/2"])
  })

  it("does not pass a checked branch down to a disabled lazy child", () => {
    const loaded: TreeData[] = [
      {
        id: "remote",
        children: [
          { id: "remote/1" },
          { id: "remote/2" },
          { id: "remote/locked", disabled: true },
        ],
      },
    ]
    const states = checkedStates(loaded, new Set(["remote"]))
    expect(states.get("remote/locked")).toBe(false)
    expect(states.get("remote")).toBe("mixed")
    expect(toggleChecked(loaded, ["remote"], "remote/1")).toEqual(["remote/2"])
  })
})
