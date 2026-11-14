import { describe, expect, it } from "vitest"

import {
  filterSections,
  matchesTrigger,
} from "@/registry/default/lib/shortcut-cheatsheet-utils"

const SECTIONS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: "Mod+K", label: "Search" },
      { keys: "G", label: "Go to inbox" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [{ keys: "Mod+Enter", label: "Send message" }],
  },
]

function pressOn(target: EventTarget, init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", { bubbles: true, ...init })
  target.dispatchEvent(event)
  return event
}

describe("filterSections", () => {
  it("returns every section for a blank query", () => {
    expect(filterSections(SECTIONS, "  ")).toBe(SECTIONS)
  })

  it("keeps only matching shortcuts, ignoring case and dropping empty sections", () => {
    expect(filterSections(SECTIONS, "INBOX")).toEqual([
      {
        title: "Navigation",
        shortcuts: [{ keys: "G", label: "Go to inbox" }],
      },
    ])
  })

  it("keeps a whole section when its title matches", () => {
    expect(filterSections(SECTIONS, "edit")).toEqual([SECTIONS[1]])
  })

  it("returns nothing when no label or title matches", () => {
    expect(filterSections(SECTIONS, "zzz")).toEqual([])
  })
})

describe("matchesTrigger", () => {
  it("matches a character the keyboard produces with Shift", () => {
    const event = pressOn(document.body, {
      key: "?",
      code: "Slash",
      shiftKey: true,
    })
    expect(matchesTrigger(event, "?", false)).toBe(true)
  })

  it("rejects a character held with a command modifier", () => {
    const event = pressOn(document.body, {
      key: "?",
      code: "Slash",
      shiftKey: true,
      metaKey: true,
    })
    expect(matchesTrigger(event, "?", true)).toBe(false)
  })

  it("matches a recorded shortcut for the platform", () => {
    const event = pressOn(document.body, {
      key: "/",
      code: "Slash",
      metaKey: true,
    })
    expect(matchesTrigger(event, "Mod+/", true)).toBe(true)
    expect(matchesTrigger(event, "Mod+/", false)).toBe(false)
  })

  it("never matches an empty trigger", () => {
    const event = pressOn(document.body, { key: "a", code: "KeyA" })
    expect(matchesTrigger(event, "", false)).toBe(false)
    expect(matchesTrigger(pressOn(document.body, {}), "", false)).toBe(false)
  })

  it("treats a named key as a shortcut, so Shift does not match", () => {
    const key = { key: "F1", code: "F1" }
    expect(matchesTrigger(pressOn(document.body, key), "F1", false)).toBe(true)
    expect(
      matchesTrigger(
        pressOn(document.body, { ...key, shiftKey: true }),
        "F1",
        false
      )
    ).toBe(false)
  })

  it("treats an uppercase letter as the key without Shift", () => {
    const letter = pressOn(document.body, { key: "g", code: "KeyG" })
    const shifted = pressOn(document.body, {
      key: "G",
      code: "KeyG",
      shiftKey: true,
    })
    expect(matchesTrigger(letter, "G", false)).toBe(true)
    expect(matchesTrigger(shifted, "G", false)).toBe(false)
  })

  it("matches a character typed with AltGr", () => {
    const event = pressOn(document.body, {
      key: "@",
      code: "KeyQ",
      ctrlKey: true,
      altKey: true,
      modifierAltGraph: true,
    })
    expect(matchesTrigger(event, "@", false)).toBe(true)
  })

  it("matches a character typed with Option on macOS only", () => {
    const event = pressOn(document.body, {
      key: "@",
      code: "KeyL",
      altKey: true,
    })
    expect(matchesTrigger(event, "@", true)).toBe(true)
    expect(matchesTrigger(event, "@", false)).toBe(false)
  })

  it.each(["input", "textarea", "select"])("ignores keys in a %s", (tag) => {
    const field = document.createElement(tag)
    document.body.append(field)
    const event = pressOn(field, { key: "?" })
    field.remove()
    expect(matchesTrigger(event, "?", false)).toBe(false)
  })

  it("ignores keys inside contenteditable", () => {
    const editor = document.createElement("div")
    editor.setAttribute("contenteditable", "true")
    const child = editor.appendChild(document.createElement("span"))
    document.body.append(editor)
    const event = pressOn(child, { key: "?" })
    editor.remove()
    expect(matchesTrigger(event, "?", false)).toBe(false)
  })

  it.each(["checkbox", "radio", "button", "range"])(
    "still matches on a %s input",
    (type) => {
      const control = document.createElement("input")
      control.type = type
      document.body.append(control)
      const event = pressOn(control, { key: "?" })
      control.remove()
      expect(matchesTrigger(event, "?", false)).toBe(true)
    }
  )

  it("still matches on a read-only island inside an editor", () => {
    const editor = document.createElement("div")
    editor.setAttribute("contenteditable", "true")
    const island = editor.appendChild(document.createElement("div"))
    island.setAttribute("contenteditable", "false")
    document.body.append(editor)
    const event = pressOn(island, { key: "?" })
    editor.remove()
    expect(matchesTrigger(event, "?", false)).toBe(true)
  })

  it("ignores keys in a field inside a shadow root", () => {
    const host = document.createElement("div")
    const field = document.createElement("input")
    host.attachShadow({ mode: "open" }).append(field)
    document.body.append(host)

    let matched: boolean | undefined
    function listener(event: Event) {
      matched = matchesTrigger(event as KeyboardEvent, "?", false)
    }
    window.addEventListener("keydown", listener)
    pressOn(field, { key: "?", composed: true })
    window.removeEventListener("keydown", listener)
    host.remove()

    expect(matched).toBe(false)
  })
})
