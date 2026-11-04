import * as React from "react"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { Comment } from "@/registry/default/lib/comment-thread"
import { CommentThread } from "@/registry/default/ui/comment-thread"

const NOW = new Date("2026-11-04T12:00:00Z")
const me = { id: "noor", name: "Noor Haddad" }
const tomasz = { id: "tomasz", name: "Tomasz Wierzba" }
const PEOPLE = [
  { value: "noor", label: "Noor Haddad" },
  { value: "tomasz", label: "Tomasz Wierzba" },
]

const COMMENTS: Comment[] = [
  {
    id: "c1",
    author: tomasz,
    body: "Should this retry on 429? cc @noor",
    createdAt: "2026-11-04T10:00:00Z",
    reactions: [{ emoji: "👀", userIds: ["tomasz"] }],
  },
  {
    id: "c2",
    parentId: "c1",
    author: me,
    body: "Yes, with backoff.",
    createdAt: "2026-11-04T11:00:00Z",
  },
]

type Props = Partial<React.ComponentProps<typeof CommentThread>>

function renderThread(props: Props = {}) {
  return render(
    <CommentThread
      defaultComments={COMMENTS}
      currentUser={me}
      mentionSuggestions={PEOPLE}
      now={NOW}
      locale="en"
      {...props}
    />
  )
}

function article(text: string) {
  return screen
    .getAllByRole("article")
    .find((element) => element.textContent?.includes(text))!
}

function composer() {
  return screen.getByRole("textbox", { name: "Comment" })
}

describe("CommentThread", () => {
  it("renders comments, replies, relative times and mentions", () => {
    renderThread()

    expect(
      screen.getByRole("article", { name: "Tomasz Wierzba 2 hours ago" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("list", { name: "Replies to Tomasz Wierzba" })
    ).toContainElement(article("Yes, with backoff."))
    const mention = screen.getByText("@noor")
    expect(mention).toHaveAttribute("data-slot", "comment-thread-mention")
    expect(screen.getByText("2 hours ago")).toHaveAttribute(
      "datetime",
      "2026-11-04T10:00:00.000Z"
    )
  })

  it("never renders the body as HTML", () => {
    renderThread({
      defaultComments: [
        {
          id: "x",
          author: tomasz,
          body: "<img src=x onerror=alert(1)>",
          createdAt: NOW,
        },
      ],
    })

    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument()
    expect(document.querySelector("img[src='x']")).toBeNull()
  })

  it("posts with Ctrl+Enter and reports mentions", async () => {
    const user = userEvent.setup()
    const onReply = vi.fn()
    const onCommentsChange = vi.fn()
    renderThread({ onReply, onCommentsChange })

    await user.type(composer(), "  Thanks @tomasz  ")
    await user.keyboard("{Control>}{Enter}{/Control}")

    expect(onReply).toHaveBeenCalledWith(null, "Thanks @tomasz", ["tomasz"])
    await waitFor(() => expect(composer()).toHaveValue(""))
    expect(onCommentsChange).toHaveBeenLastCalledWith([
      ...COMMENTS,
      expect.objectContaining({
        parentId: null,
        author: me,
        body: "Thanks @tomasz",
      }),
    ])
    expect(article("Thanks")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Comment posted")
    expect(composer()).toHaveFocus()
  })

  it("shows the current user's avatar beside the comment and reply boxes", async () => {
    const user = userEvent.setup()
    renderThread()

    const main = composer().closest('[data-slot="comment-thread-composer"]')!
    expect(main).toHaveTextContent("NH")
    await user.click(
      within(article("Should this retry")).getByRole("button", {
        name: "Reply to Tomasz Wierzba",
      })
    )
    const reply = screen
      .getByRole("textbox", { name: "Reply" })
      .closest('[data-slot="comment-thread-composer"]')!
    expect(reply).toHaveTextContent("NH")

    await user.click(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Edit comment",
      })
    )
    const editor = screen
      .getByRole("textbox", { name: "Edit comment" })
      .closest('[data-slot="comment-thread-composer"]')!
    expect(editor.querySelector('[data-slot="avatar"]')).toBeNull()
  })

  it("keeps both comments when two saves resolve in the same tick", async () => {
    const user = userEvent.setup()
    const pending: (() => void)[] = []
    const onCommentsChange = vi.fn()
    renderThread({
      onCommentsChange,
      onReply: () =>
        new Promise<void>((resolve) => {
          pending.push(resolve)
        }),
    })

    await user.type(composer(), "First")
    await user.click(screen.getByRole("button", { name: "Comment" }))
    await user.click(
      within(article("Should this retry")).getByRole("button", {
        name: "Reply to Tomasz Wierzba",
      })
    )
    await user.type(screen.getByRole("textbox", { name: "Reply" }), "Second")
    await user.click(screen.getByRole("button", { name: "Reply" }))
    expect(pending).toHaveLength(2)

    await act(async () => {
      pending.forEach((resolve) => resolve())
    })

    const bodies = onCommentsChange.mock.lastCall![0].map(
      (comment: Comment) => comment.body
    )
    expect(bodies).toEqual(expect.arrayContaining(["First", "Second"]))
    expect(article("First")).toBeDefined()
    expect(article("Second")).toBeDefined()
  })

  it("leaves another comment's editor open when a slow save finishes", async () => {
    const user = userEvent.setup()
    let finish = () => {}
    renderThread({
      defaultComments: [
        { id: "a", author: me, body: "First draft", createdAt: NOW },
        { id: "b", author: me, body: "Second note", createdAt: NOW },
      ],
      onEdit: () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    })

    await user.click(
      within(article("First draft")).getByRole("button", {
        name: "Edit comment",
      })
    )
    await user.type(
      screen.getByRole("textbox", { name: "Edit comment" }),
      " v2"
    )
    await user.click(screen.getByRole("button", { name: "Save" }))
    await user.click(
      within(article("Second note")).getByRole("button", {
        name: "Edit comment",
      })
    )
    await act(async () => finish())

    expect(screen.getByRole("textbox", { name: "Edit comment" })).toHaveValue(
      "Second note"
    )
    expect(screen.getByText("First draft v2")).toBeInTheDocument()
  })

  it("does not submit a blank comment", async () => {
    const user = userEvent.setup()
    const onReply = vi.fn()
    renderThread({ onReply })

    expect(screen.getByRole("button", { name: "Comment" })).toBeDisabled()
    await user.type(composer(), "   ")
    await user.keyboard("{Meta>}{Enter}{/Meta}")

    expect(onReply).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Comment" })).toBeDisabled()
  })

  it("keeps the draft and shows an error when posting fails", async () => {
    const user = userEvent.setup()
    const onCommentsChange = vi.fn()
    renderThread({
      onCommentsChange,
      onReply: () => Promise.reject(new Error("offline")),
    })

    await user.type(composer(), "Important note")
    await user.click(screen.getByRole("button", { name: "Comment" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't post your comment"
    )
    expect(composer()).toHaveValue("Important note")
    expect(composer()).toHaveAttribute("aria-invalid", "true")
    expect(onCommentsChange).not.toHaveBeenCalled()
  })

  it("lets Enter pick a mention instead of submitting", async () => {
    const user = userEvent.setup()
    const onReply = vi.fn()
    renderThread({ onReply })

    await user.type(composer(), "cc @tom")
    await user.keyboard("{Control>}{Enter}{/Control}")

    expect(onReply).not.toHaveBeenCalled()
    expect(composer()).toHaveValue("cc @tomasz ")
  })

  it("replies inline under the top-level comment and prefills the reply author", async () => {
    const user = userEvent.setup()
    const onReply = vi.fn()
    renderThread({
      onReply,
      defaultComments: [
        ...COMMENTS,
        {
          id: "c3",
          parentId: "c1",
          author: tomasz,
          body: "What about 503?",
          createdAt: NOW,
        },
      ],
    })

    const replyToReply = within(article("What about 503?")).getByRole(
      "button",
      { name: "Reply to Tomasz Wierzba" }
    )
    await user.click(replyToReply)

    const box = screen.getByRole("textbox", { name: "Reply" })
    expect(box).toHaveFocus()
    expect(box).toHaveValue("@tomasz ")
    await user.type(box, "same policy")
    await user.keyboard("{Control>}{Enter}{/Control}")

    expect(onReply).toHaveBeenCalledWith("c1", "@tomasz same policy", [
      "tomasz",
    ])
    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: "Reply" })).toBeNull()
    )
    expect(
      screen.getByRole("list", { name: "Replies to Tomasz Wierzba" })
    ).toContainElement(article("same policy"))
    expect(replyToReply).toHaveFocus()
  })

  it("cancels a reply with Escape and returns focus", async () => {
    const user = userEvent.setup()
    renderThread()

    const button = within(article("Should this retry")).getByRole("button", {
      name: "Reply to Tomasz Wierzba",
    })
    await user.click(button)
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("textbox", { name: "Reply" })).toBeNull()
    expect(button).toHaveFocus()
  })

  it("only offers edit and delete on the current user's comments", () => {
    renderThread()

    const theirs = within(article("Should this retry"))
    expect(theirs.queryByRole("button", { name: "Edit comment" })).toBeNull()
    expect(theirs.queryByRole("button", { name: "Delete comment" })).toBeNull()
    const mine = within(article("Yes, with backoff."))
    expect(mine.getByRole("button", { name: "Edit comment" })).toBeVisible()
    expect(mine.getByRole("button", { name: "Delete comment" })).toBeVisible()
  })

  it("edits with Ctrl+Enter, marks the comment edited and refocuses Edit", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderThread({ onEdit })

    await user.click(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Edit comment",
      })
    )
    const box = screen.getByRole("textbox", { name: "Edit comment" })
    expect(box).toHaveFocus()
    await user.clear(box)
    await user.type(box, "Yes, backoff. cc @tomasz first")
    await user.keyboard("{Control>}{Enter}{/Control}")

    expect(onEdit).toHaveBeenCalledWith(
      "c2",
      "Yes, backoff. cc @tomasz first",
      ["tomasz"]
    )
    await waitFor(() => expect(article("cc @tomasz first")).toBeDefined())
    const edited = article("cc @tomasz first")
    expect(within(edited).getByText("(edited)")).toBeInTheDocument()
    expect(
      within(edited).getByRole("button", { name: "Edit comment" })
    ).toHaveFocus()
  })

  it("restores the original text when an edit is cancelled with Escape", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderThread({ onEdit })

    await user.click(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Edit comment",
      })
    )
    await user.type(
      screen.getByRole("textbox", { name: "Edit comment" }),
      " changed"
    )
    await user.keyboard("{Escape}")

    expect(onEdit).not.toHaveBeenCalled()
    expect(article("Yes, with backoff.").textContent).not.toContain("changed")
    expect(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Edit comment",
      })
    ).toHaveFocus()
  })

  it("skips onEdit when the text did not change", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderThread({ onEdit })

    await user.click(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Edit comment",
      })
    )
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: "Edit comment" })).toBeNull()
    )
    expect(onEdit).not.toHaveBeenCalled()
    expect(
      within(article("Yes, with backoff.")).queryByText("(edited)")
    ).toBeNull()
  })

  it("asks before deleting and moves focus to a neighbour", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderThread({
      onDelete,
      defaultComments: [
        ...COMMENTS,
        { id: "c3", author: me, body: "Second thread", createdAt: NOW },
      ],
    })

    await user.click(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Delete comment",
      })
    )
    const confirm = screen.getByRole("group", { name: "Confirm delete" })
    expect(
      within(confirm).getByRole("button", { name: "Cancel" })
    ).toHaveFocus()
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(within(confirm).getByRole("button", { name: "Delete" }))

    expect(onDelete).toHaveBeenCalledWith("c2")
    await waitFor(() =>
      expect(screen.queryByText("Yes, with backoff.")).toBeNull()
    )
    expect(article("Second thread")).toHaveFocus()
    expect(screen.getByRole("status")).toHaveTextContent("Comment deleted")
  })

  it("cancels a delete with Escape", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderThread({ onDelete })

    const deleteButton = within(article("Yes, with backoff.")).getByRole(
      "button",
      { name: "Delete comment" }
    )
    await user.click(deleteButton)
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("group", { name: "Confirm delete" })).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()
    expect(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Delete comment",
      })
    ).toHaveFocus()
  })

  it("keeps the comment when deleting fails", async () => {
    const user = userEvent.setup()
    renderThread({ onDelete: () => Promise.reject(new Error("403")) })

    await user.click(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Delete comment",
      })
    )
    await user.click(screen.getByRole("button", { name: "Delete" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't delete"
    )
    expect(screen.getByText("Yes, with backoff.")).toBeInTheDocument()
  })

  it("leaves a placeholder when a comment with replies is deleted", async () => {
    const user = userEvent.setup()
    renderThread({
      defaultComments: [
        { ...COMMENTS[0], author: me },
        { ...COMMENTS[1], author: tomasz },
      ],
    })

    await user.click(
      within(article("Should this retry")).getByRole("button", {
        name: "Delete comment",
      })
    )
    await user.click(screen.getByRole("button", { name: "Delete" }))

    const placeholder = await screen.findByRole("article", {
      name: "Deleted comment",
    })
    expect(placeholder).toHaveFocus()
    expect(screen.getByText("Yes, with backoff.")).toBeInTheDocument()
  })

  it("toggles reactions from the picker and the chips", async () => {
    const user = userEvent.setup()
    const onReactionToggle = vi.fn()
    renderThread({ onReactionToggle })

    const target = within(article("Should this retry"))
    const eyes = target.getByRole("button", { name: "Eyes: Tomasz Wierzba" })
    expect(eyes).toHaveAttribute("aria-pressed", "false")
    await user.click(eyes)

    expect(onReactionToggle).toHaveBeenLastCalledWith("c1", "👀")
    expect(
      target.getByRole("button", { name: "Eyes: You and Tomasz Wierzba" })
    ).toHaveAttribute("aria-pressed", "true")

    const add = target.getByRole("button", { name: "Add reaction" })
    await user.click(add)
    expect(add).toHaveAttribute("aria-expanded", "true")
    const picker = screen.getByRole("group", { name: "Pick a reaction" })
    expect(add).toHaveAttribute("aria-controls", picker.id)
    expect(
      within(picker).getByRole("button", { name: "Thumbs up" })
    ).toHaveFocus()

    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{Enter}")

    expect(onReactionToggle).toHaveBeenLastCalledWith("c1", "🎉")
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull()
    expect(add).toHaveFocus()
    expect(
      target.getByRole("button", { name: "Hooray: You" })
    ).toBeInTheDocument()
  })

  it("describes who reacted in a tooltip hidden from assistive tech", () => {
    renderThread({ currentUser: undefined })

    const tooltip = article("Should this retry").querySelector(
      '[data-slot="comment-thread-reaction-tooltip"]'
    )
    expect(tooltip).toHaveAttribute("aria-hidden", "true")
    expect(tooltip).toHaveTextContent("👀 Eyes")
    expect(tooltip).toHaveTextContent("Tomasz Wierzba")
  })

  it("closes the reaction picker with Escape", async () => {
    const user = userEvent.setup()
    renderThread()

    const add = within(article("Yes, with backoff.")).getByRole("button", {
      name: "Add reaction",
    })
    await user.click(add)
    await user.keyboard("{End}")
    expect(
      within(screen.getByRole("group", { name: "Pick a reaction" })).getByRole(
        "button",
        { name: "Eyes" }
      )
    ).toHaveFocus()
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull()
    expect(add).toHaveFocus()
  })

  it("floats the picker in the actions and closes it on an outside click", async () => {
    const user = userEvent.setup()
    renderThread()

    const actions = within(article("Yes, with backoff.")).getByRole("group", {
      name: "Comment actions",
    })
    await user.click(
      within(actions).getByRole("button", { name: "Add reaction" })
    )
    expect(actions).toContainElement(
      screen.getByRole("group", { name: "Pick a reaction" })
    )

    await user.click(screen.getByText("Should this retry on 429? cc"))

    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull()
  })

  it("closes the picker when focus tabs away", async () => {
    const user = userEvent.setup()
    renderThread()

    await user.click(
      within(article("Yes, with backoff.")).getByRole("button", {
        name: "Add reaction",
      })
    )
    await user.tab()

    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull()
  })

  it("resolves into a collapsed summary and reopens", async () => {
    const user = userEvent.setup()
    const onResolvedChange = vi.fn()
    renderThread({ onResolvedChange })

    await user.click(screen.getByRole("button", { name: "Resolve thread" }))

    expect(onResolvedChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByText("Resolved")).toBeInTheDocument()
    expect(screen.getByText(/by Noor Haddad/)).toBeInTheDocument()
    expect(screen.getByText(/2 comments/)).toBeInTheDocument()
    expect(screen.queryByRole("article")).toBeNull()
    const toggle = screen.getByRole("button", { name: "Show thread" })
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute("aria-expanded", "false")

    await user.click(toggle)
    expect(screen.getAllByRole("article")).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Hide thread" })).toHaveAttribute(
      "aria-expanded",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "Reopen" }))
    expect(onResolvedChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole("button", { name: "Resolve thread" })).toHaveFocus()
  })

  it("follows a controlled resolved prop", () => {
    render(
      <CommentThread
        comments={COMMENTS}
        resolved
        resolvedBy={tomasz}
        currentUser={me}
        now={NOW}
      />
    )

    expect(screen.getByText(/by Tomasz Wierzba/)).toBeInTheDocument()
  })

  it("does not change controlled comments on its own", async () => {
    const user = userEvent.setup()
    const onCommentsChange = vi.fn()
    render(
      <CommentThread
        comments={COMMENTS}
        onCommentsChange={onCommentsChange}
        currentUser={me}
        now={NOW}
      />
    )

    await user.type(composer(), "Hi")
    await user.click(screen.getByRole("button", { name: "Comment" }))

    await waitFor(() => expect(onCommentsChange).toHaveBeenCalled())
    expect(screen.getAllByRole("article")).toHaveLength(2)
  })

  it("is read-only without a current user", () => {
    renderThread({ currentUser: undefined })

    expect(screen.queryByRole("textbox")).toBeNull()
    expect(
      screen.queryByRole("button", {
        name: /Reply|Edit|Delete|Add reaction|Resolve/,
      })
    ).toBeNull()
    expect(
      screen.getByRole("button", { name: "Eyes: Tomasz Wierzba" })
    ).toBeDisabled()
  })

  it("shows an empty state and hides Resolve without comments", () => {
    renderThread({ defaultComments: [] })

    expect(
      screen.getByText("No comments yet. Start the thread below.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Resolve thread" })).toBeNull()
  })

  it("skips the timestamp when the date is invalid", () => {
    renderThread({
      defaultComments: [
        { id: "bad", author: tomasz, body: "Hello", createdAt: "garbage" },
      ],
    })

    expect(
      screen.getByRole("article", { name: "Tomasz Wierzba" })
    ).toBeInTheDocument()
    expect(document.querySelector("time")).toBeNull()
  })

  it("forwards a ref without breaking focus restoration", async () => {
    const user = userEvent.setup()
    const ref = React.createRef<HTMLElement>()
    renderThread({ ref })

    expect(ref.current).toHaveAttribute("data-slot", "comment-thread")
    const button = within(article("Should this retry")).getByRole("button", {
      name: "Reply to Tomasz Wierzba",
    })
    await user.click(button)
    await user.keyboard("{Escape}")

    expect(button).toHaveFocus()
  })

  it("spreads props and className onto the section", () => {
    renderThread({ className: "custom", "aria-label": "Review on retry.ts" })

    const section = screen.getByRole("region", { name: "Review on retry.ts" })
    expect(section).toHaveClass("custom")
    expect(section).toHaveAttribute("data-slot", "comment-thread")
  })
})
