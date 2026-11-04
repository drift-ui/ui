import { describe, expect, it } from "vitest"

import {
  addComment,
  buildThread,
  countVisible,
  deleteComment,
  describeReactors,
  editComment,
  extractMentions,
  formatRelativeTime,
  initialsOf,
  parseBody,
  toDate,
  toggleReaction,
  type Comment,
} from "@/registry/default/lib/comment-thread"

const noor = { id: "noor", name: "Noor Haddad" }
const tomasz = { id: "tomasz", name: "Tomasz Wierzba" }

function comment(id: string, parentId?: string, extra?: Partial<Comment>) {
  return {
    id,
    parentId,
    author: noor,
    body: id,
    createdAt: "2026-11-01T10:00:00Z",
    ...extra,
  } satisfies Comment
}

const PEOPLE = [
  { value: "noor", label: "Noor Haddad" },
  { value: "tomasz", label: "Tomasz Wierzba" },
  { value: "tom", label: "Tom Ito" },
  { value: "j.doe", label: "Jane Doe" },
]

describe("toDate", () => {
  it("accepts dates and ISO strings", () => {
    expect(toDate("2026-11-01T10:00:00Z")?.toISOString()).toBe(
      "2026-11-01T10:00:00.000Z"
    )
    const date = new Date(0)
    expect(toDate(date)).toBe(date)
  })

  it("returns null for missing or invalid values", () => {
    expect(toDate(undefined)).toBeNull()
    expect(toDate(null)).toBeNull()
    expect(toDate("")).toBeNull()
    expect(toDate("not a date")).toBeNull()
    expect(toDate(new Date(Number.NaN))).toBeNull()
  })
})

describe("buildThread", () => {
  it("groups replies under their top-level comment in array order", () => {
    const nodes = buildThread([
      comment("a"),
      comment("b"),
      comment("a1", "a"),
      comment("b1", "b"),
      comment("a2", "a"),
    ])

    expect(
      nodes.map((node) => [node.comment.id, node.replies.map((r) => r.id)])
    ).toEqual([
      ["a", ["a1", "a2"]],
      ["b", ["b1"]],
    ])
  })

  it("flattens replies to replies onto the top-level comment", () => {
    const nodes = buildThread([
      comment("a"),
      comment("a1", "a"),
      comment("a1x", "a1"),
    ])

    expect(nodes).toHaveLength(1)
    expect(nodes[0].replies.map((r) => r.id)).toEqual(["a1", "a1x"])
  })

  it("keeps a reply that arrives before its parent", () => {
    const nodes = buildThread([comment("a1", "a"), comment("a")])

    expect(nodes.map((node) => node.comment.id)).toEqual(["a"])
    expect(nodes[0].replies.map((r) => r.id)).toEqual(["a1"])
  })

  it("shows a reply with a missing parent as a top-level comment", () => {
    const nodes = buildThread([comment("orphan", "gone")])

    expect(nodes.map((node) => node.comment.id)).toEqual(["orphan"])
  })

  it("does not loop on a parent cycle", () => {
    const nodes = buildThread([comment("x", "y"), comment("y", "x")])

    expect(nodes.map((node) => node.comment.id)).toEqual(["x", "y"])
    expect(countVisible(nodes)).toBe(2)
  })

  it("keeps a deleted comment only while it has replies", () => {
    expect(
      buildThread([comment("a", undefined, { deleted: true })])
    ).toHaveLength(0)

    const nodes = buildThread([
      comment("a", undefined, { deleted: true }),
      comment("a1", "a"),
      comment("a2", "a", { deleted: true }),
    ])
    expect(nodes[0].comment.deleted).toBe(true)
    expect(nodes[0].replies.map((r) => r.id)).toEqual(["a1"])
    expect(countVisible(nodes)).toBe(1)
  })
})

describe("parseBody", () => {
  it("turns known handles into mention segments", () => {
    expect(parseBody("cc @noor, can you look?", PEOPLE)).toEqual([
      { type: "text", text: "cc " },
      { type: "mention", text: "@noor", option: PEOPLE[0] },
      { type: "text", text: ", can you look?" },
    ])
  })

  it("prefers the longest matching handle", () => {
    const segments = parseBody("@tomasz and @tom", PEOPLE)

    expect(
      segments.filter((s) => s.type === "mention").map((s) => s.text)
    ).toEqual(["@tomasz", "@tom"])
  })

  it("ignores emails, unknown handles and partial matches", () => {
    for (const body of [
      "mail noor@example.com",
      "@nobody here",
      "@noorx",
      "a@noor",
    ]) {
      expect(parseBody(body, PEOPLE)).toEqual([{ type: "text", text: body }])
    }
  })

  it("escapes handles that contain regex characters", () => {
    expect(parseBody("@j.doe", PEOPLE)[0]).toMatchObject({
      type: "mention",
      text: "@j.doe",
    })
    expect(parseBody("@jxdoe", PEOPLE)[0].type).toBe("text")
  })

  it("matches mentions in brackets and at line starts", () => {
    const body = "(@noor)\n@tomasz"

    expect(extractMentions(body, PEOPLE)).toEqual(["noor", "tomasz"])
  })

  it("returns plain text when there are no suggestions", () => {
    expect(parseBody("@noor", [])).toEqual([{ type: "text", text: "@noor" }])
    expect(parseBody("", PEOPLE)).toEqual([])
  })
})

describe("extractMentions", () => {
  it("lists each mentioned value once", () => {
    expect(extractMentions("@noor @tom @noor", PEOPLE)).toEqual(["noor", "tom"])
  })
})

describe("comment reducers", () => {
  it("adds and edits comments without mutating the input", () => {
    const start = [comment("a")]
    const added = addComment(start, comment("b"))
    const editedAt = new Date("2026-11-02T00:00:00Z")
    const edited = editComment(added, "a", "new body", editedAt)

    expect(start).toHaveLength(1)
    expect(edited[0]).toMatchObject({ body: "new body", editedAt })
    expect(edited[1]).toBe(added[1])
  })

  it("removes a comment without replies", () => {
    expect(deleteComment([comment("a"), comment("b")], "a")).toEqual([
      comment("b"),
    ])
  })

  it("leaves a placeholder for a comment with replies", () => {
    const next = deleteComment([comment("a"), comment("a1", "a")], "a")

    expect(next[0]).toMatchObject({ id: "a", deleted: true, body: "" })
    expect(next).toHaveLength(2)
  })

  it("removes a deleted parent once its last reply is deleted", () => {
    const start = deleteComment([comment("a"), comment("a1", "a")], "a")

    expect(deleteComment(start, "a1")).toEqual([])
  })

  it("ignores unknown ids", () => {
    const start = [comment("a")]

    expect(deleteComment(start, "missing")).toBe(start)
  })
})

describe("toggleReaction", () => {
  it("adds, extends, removes and drops empty reactions", () => {
    let list: Comment[] = [comment("a")]
    list = toggleReaction(list, "a", "👍", "noor")
    expect(list[0].reactions).toEqual([{ emoji: "👍", userIds: ["noor"] }])

    list = toggleReaction(list, "a", "👍", "tomasz")
    expect(list[0].reactions).toEqual([
      { emoji: "👍", userIds: ["noor", "tomasz"] },
    ])

    list = toggleReaction(list, "a", "👍", "noor")
    list = toggleReaction(list, "a", "👍", "tomasz")
    expect(list[0].reactions).toEqual([])
  })

  it("keeps other reactions in place", () => {
    const list = toggleReaction(
      [
        comment("a", undefined, {
          reactions: [
            { emoji: "🎉", userIds: ["tomasz"] },
            { emoji: "👀", userIds: ["tomasz"] },
          ],
        }),
      ],
      "a",
      "🎉",
      "tomasz"
    )

    expect(list[0].reactions).toEqual([{ emoji: "👀", userIds: ["tomasz"] }])
  })
})

describe("describeReactors", () => {
  const names = new Map([
    [noor.id, noor.name],
    [tomasz.id, tomasz.name],
  ])

  it("puts the current user first", () => {
    expect(describeReactors(["tomasz", "noor"], names, "noor", "en")).toBe(
      "You and Tomasz Wierzba"
    )
  })

  it("counts unknown or overflowing people as others", () => {
    expect(describeReactors(["noor", "x", "y"], names, undefined, "en")).toBe(
      "Noor Haddad and 2 others"
    )
    expect(describeReactors(["x"], names, undefined, "en")).toBe("1 other")
  })

  it("ignores duplicate ids", () => {
    expect(describeReactors(["noor", "noor"], names, undefined, "en")).toBe(
      "Noor Haddad"
    )
  })
})

describe("initialsOf", () => {
  it("uses the first and last word", () => {
    expect(initialsOf("Noor Haddad")).toBe("NH")
    expect(initialsOf("Ana María López")).toBe("AL")
    expect(initialsOf("plato")).toBe("PL")
    expect(initialsOf("  ")).toBe("?")
  })
})

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-04T12:00:00Z")
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000)

  it.each([
    [10, "now"],
    [60, "1 minute ago"],
    [59 * 60, "59 minutes ago"],
    [60 * 60, "1 hour ago"],
    [119 * 60, "1 hour ago"],
    [24 * 60 * 60, "yesterday"],
    [3 * 24 * 60 * 60, "3 days ago"],
    [7 * 24 * 60 * 60, "last week"],
    [40 * 24 * 60 * 60, "last month"],
    [400 * 24 * 60 * 60, "last year"],
  ])("%i seconds ago reads %s", (seconds, expected) => {
    expect(formatRelativeTime(ago(seconds), now, "en")).toBe(expected)
  })

  it("formats future times for clock skew", () => {
    expect(formatRelativeTime(ago(-5 * 60), now, "en")).toBe("in 5 minutes")
  })
})
