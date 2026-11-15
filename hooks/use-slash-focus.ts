import { useEffect, type RefObject } from "react"

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

export function useSlashFocus(inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [inputRef])
}
