"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/registry/default/ui/button"
import { CodeFrame } from "@/components/docs/code-frame"
import type { CodeBundle, HighlightedFile } from "@/lib/component-docs"

export type CodeRef = { src: string; title: string }

const bundles = new Map<string, Promise<CodeBundle>>()

function loadBundle(src: string) {
  let bundle = bundles.get(src)
  if (!bundle) {
    bundle = fetch(src).then((response) => {
      if (!response.ok) throw new Error(`${src} returned ${response.status}`)
      return response.json() as Promise<CodeBundle>
    })
    bundle.catch(() => bundles.delete(src))
    bundles.set(src, bundle)
  }
  return bundle
}

export function LazyCodeFrame({
  src,
  title,
  collapsible = false,
}: CodeRef & { collapsible?: boolean }) {
  const placeholderRef = useRef<HTMLElement>(null)
  const [file, setFile] = useState<HighlightedFile>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const placeholder = placeholderRef.current
    if (!placeholder || file || failed) return

    let active = true
    const observer = new IntersectionObserver(
      ([visible]) => {
        if (!visible?.isIntersecting) return
        observer.disconnect()
        loadBundle(src).then(
          (bundle) => {
            if (!active) return
            if (bundle[title]) setFile(bundle[title])
            else setFailed(true)
          },
          () => active && setFailed(true)
        )
      },
      { rootMargin: "400px" }
    )
    observer.observe(placeholder)

    return () => {
      active = false
      observer.disconnect()
    }
  }, [src, title, file, failed])

  if (file) return <CodeFrame {...file} collapsible={collapsible} />

  return (
    <figure
      ref={placeholderRef}
      aria-busy={!failed}
      className="overflow-hidden rounded-2xl border bg-card text-card-foreground"
    >
      <figcaption className="flex h-11 items-center border-b px-4 font-mono text-xs text-muted-foreground">
        <span className="truncate">{title}</span>
      </figcaption>
      {failed ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          Couldn&apos;t load this code.
          <Button variant="outline" size="sm" onClick={() => setFailed(false)}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="h-40 bg-muted/40 motion-safe:animate-pulse" />
      )}
    </figure>
  )
}
