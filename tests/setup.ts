import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function matchMediaStub(query: string) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }
}

globalThis.ResizeObserver ??= ResizeObserverStub
window.matchMedia ??= matchMediaStub as unknown as typeof window.matchMedia
Element.prototype.scrollIntoView ??= () => {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
HTMLCanvasElement.prototype.getContext = (() =>
  null) as HTMLCanvasElement["getContext"]

afterEach(() => {
  cleanup()
})
