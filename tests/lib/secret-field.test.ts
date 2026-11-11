import { describe, expect, it } from "vitest"

import {
  getVisibleTail,
  maskSecret,
} from "@/registry/default/lib/secret-field-utils"

describe("secret-field logic", () => {
  it("masks everything but the last visibleChars", () => {
    expect(maskSecret("sk_live_51Mz8a1b2", 4)).toBe("••••••••a1b2")
  })

  it("keeps the mask length fixed whatever the value length", () => {
    expect(maskSecret("abcdefghijklmnopqrstuvwxyz", 2)).toBe("••••••••yz")
  })

  it("fully masks values no longer than visibleChars", () => {
    expect(maskSecret("abc", 4)).toBe("••••••••")
    expect(maskSecret("abcd", 4)).toBe("••••••••")
    expect(getVisibleTail("", 4)).toBe("")
  })

  it("shows nothing when visibleChars is zero or negative", () => {
    expect(maskSecret("secret", 0)).toBe("••••••••")
    expect(maskSecret("secret", -2)).toBe("••••••••")
  })

  it("never shows the whole value for fractional or non-finite visibleChars", () => {
    expect(maskSecret("secret", 0.5)).toBe("••••••••")
    expect(maskSecret("secret", Number.NaN)).toBe("••••••••")
    expect(maskSecret("secret", Number.POSITIVE_INFINITY)).toBe("••••••••")
    expect(maskSecret("secret", 2.9)).toBe("••••••••et")
  })
})
