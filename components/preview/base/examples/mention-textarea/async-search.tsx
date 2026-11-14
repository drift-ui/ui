"use client"

import { MentionTextarea } from "@/registry/base/ui/mention-textarea"
import type { MentionOption } from "@/registry/default/lib/mention"

const PEOPLE: MentionOption[] = [
  { value: "aiko", label: "Aiko Tanaka", description: "Design" },
  { value: "kenji", label: "Kenji Mori", description: "Platform" },
  { value: "minh", label: "Minh Tran", description: "Support" },
  { value: "noor", label: "Noor Haddad", description: "Platform" },
  { value: "seo-yeon", label: "Seo-yeon Park", description: "Data" },
]

// Stands in for a fetch. Slower for short queries, so answers can arrive out of
// order, and "fail" throws, to show the error state.
function searchPeople(query: string, { signal }: { signal: AbortSignal }) {
  return new Promise<MentionOption[]>((resolve, reject) => {
    const timer = setTimeout(
      () => {
        if (query === "fail") return reject(new Error("Network error"))
        const needle = query.toLowerCase()
        resolve(
          PEOPLE.filter((person) => person.label.toLowerCase().includes(needle))
        )
      },
      query.length < 2 ? 900 : 300
    )
    signal.addEventListener("abort", () => {
      clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })
}

export function MentionTextareaAsyncSearchPreview() {
  return (
    <MentionTextarea
      aria-label="Comment"
      placeholder="Type @ to search people, or @fail"
      triggers={{ "@": searchPeople }}
      className="max-w-md"
    />
  )
}
