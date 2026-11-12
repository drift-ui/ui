import { describe, expect, it } from "vitest"

import {
  findActiveVariable,
  findTemplateVariables,
  findUnknownVariables,
  insertVariable,
} from "@/registry/default/lib/template-input-utils"

const VARIABLES = [
  { value: "first_name", label: "First name" },
  { value: "order_id", label: "Order number" },
]

describe("template-input", () => {
  it("finds the variable being typed after {{, even inside a word", () => {
    expect(findActiveVariable("Hi {{fir", 8)).toEqual({
      query: "fir",
      start: 3,
    })
    expect(findActiveVariable("id-{{", 5)).toEqual({ query: "", start: 3 })
    expect(findActiveVariable("{{ order", 8)).toEqual({
      query: "order",
      start: 0,
    })
  })

  it("ignores closed variables, plain braces and spaces in names", () => {
    expect(findActiveVariable("{{a}} done", 10)).toBeNull()
    expect(findActiveVariable("{a", 2)).toBeNull()
    expect(findActiveVariable("{{first name", 12)).toBeNull()
    expect(findActiveVariable("{{a\nb", 5)).toBeNull()
  })

  it("only reads text before the caret", () => {
    expect(findActiveVariable("{{fir}} x", 5)).toEqual({
      query: "fir",
      start: 0,
    })
    expect(findActiveVariable("{{first", 0)).toBeNull()
  })

  it("inserts a variable and swallows a closing }} after the caret", () => {
    expect(
      insertVariable(
        "Hi {{fi there",
        { query: "fi", start: 3 },
        7,
        VARIABLES[0]
      )
    ).toEqual({ text: "Hi {{first_name}} there", caret: 17 })
    expect(
      insertVariable("{{or}}!", { query: "or", start: 0 }, 4, VARIABLES[1])
    ).toEqual({ text: "{{order_id}}!", caret: 12 })
  })

  it("replaces the rest of the token when the caret is inside a name", () => {
    expect(
      insertVariable(
        "{{fir_name}} hi",
        { query: "fir", start: 0 },
        5,
        VARIABLES[0]
      )
    ).toEqual({ text: "{{first_name}} hi", caret: 14 })
    expect(
      insertVariable("{{ or }}", { query: "or", start: 0 }, 5, VARIABLES[1])
    ).toEqual({ text: "{{order_id}}", caret: 12 })
  })

  it("accepts the same name characters as complete variables", () => {
    expect(findActiveVariable("{{user:em", 9)).toEqual({
      query: "user:em",
      start: 0,
    })
  })

  it("finds complete variables with their ranges", () => {
    expect(
      findTemplateVariables("{{a}} and {{ b.c }} but not {{d e}}")
    ).toEqual([
      { name: "a", start: 0, end: 5 },
      { name: "b.c", start: 10, end: 19 },
    ])
  })

  it("lists unknown variables once each", () => {
    expect(
      findUnknownVariables(
        "{{first_name}} {{plan}} {{plan}} {{order_id}} {{x}}",
        VARIABLES
      )
    ).toEqual(["plan", "x"])
  })
})
