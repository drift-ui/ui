import { afterEach, describe, expect, it, vi } from "vitest"

import {
  exportSignature,
  nameFontSize,
  signatureImageSrc,
  strokeToPath,
} from "@/registry/default/lib/signature-pad-utils"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("strokeToPath", () => {
  it("draws a tap as a tiny segment so round caps paint a dot", () => {
    expect(strokeToPath([[10, 20]])).toBe("M10 20l.01 0")
  })

  it("joins two points with a line", () => {
    expect(
      strokeToPath([
        [0, 0],
        [10, 10],
      ])
    ).toBe("M0 0L10 10")
  })

  it("smooths through midpoints and rounds to one decimal", () => {
    expect(
      strokeToPath([
        [0, 0],
        [10, 10],
        [20.123, 0],
      ])
    ).toBe("M0 0Q10 10 15.1 5L20.1 0")
  })
})

describe("nameFontSize", () => {
  it("caps short names and shrinks long ones to fit", () => {
    expect(nameFontSize("Ada")).toBe(56)
    expect(nameFontSize("x".repeat(40))).toBeLessThan(56)
    expect(nameFontSize("x".repeat(40)) * 40 * 0.55).toBeLessThanOrEqual(561)
  })
})

describe("exportSignature", () => {
  it("returns an empty string with no ink", () => {
    expect(exportSignature([], "svg", "black")).toBe("")
    expect(exportSignature("", "png", "black")).toBe("")
  })

  it("exports strokes as an SVG path per stroke", () => {
    const svg = exportSignature(
      [
        [
          [0, 0],
          [5, 5],
        ],
        [[1, 1]],
      ],
      "svg",
      "currentColor"
    )

    expect(svg).toContain('stroke="currentColor"')
    expect(svg.match(/<path /g)).toHaveLength(2)
    expect(
      new DOMParser()
        .parseFromString(svg, "image/svg+xml")
        .querySelector("parsererror")
    ).toBeNull()
  })

  it("escapes a typed name so it cannot inject markup", () => {
    const svg = exportSignature('<script>alert("x")</script>', "svg", "black")

    expect(svg).not.toContain("<script>")
    expect(
      new DOMParser()
        .parseFromString(svg, "image/svg+xml")
        .querySelector("text")?.textContent
    ).toBe('<script>alert("x")</script>')
  })

  it("draws a PNG at twice the pad size", () => {
    const context = {
      scale: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
    }
    vi.stubGlobal("Path2D", class {})
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as RenderingContext
    )
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,AAAA")

    expect(exportSignature([[[1, 1]], [[2, 2]]], "png", "red")).toBe(
      "data:image/png;base64,AAAA"
    )
    expect(context.scale).toHaveBeenCalledWith(2, 2)
    expect(context.stroke).toHaveBeenCalledTimes(2)
    expect(toDataURL).toHaveBeenCalledWith("image/png")

    exportSignature("Ada", "png", "red")
    expect(context.fillText).toHaveBeenCalledWith("Ada", 300, 150)
  })
})

describe("signatureImageSrc", () => {
  it("passes data URLs through and encodes SVG markup", () => {
    expect(signatureImageSrc("data:image/png;base64,AA")).toBe(
      "data:image/png;base64,AA"
    )
    expect(signatureImageSrc("<svg/>")).toBe("data:image/svg+xml,%3Csvg%2F%3E")
  })
})
