import { notFound } from "next/navigation"

import { CATALOG, findEntry } from "@/lib/catalog"
import { loadCode } from "@/lib/component-docs"
import {
  isPrimitiveLibrary,
  PRIMITIVE_LIBRARIES,
} from "@/lib/primitive-library"

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return PRIMITIVE_LIBRARIES.flatMap(({ value }) =>
    CATALOG.map((entry) => ({ library: value, slug: entry.slug }))
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ library: string; slug: string }> }
) {
  const { library, slug } = await params
  const entry = findEntry(slug)
  if (!entry || !isPrimitiveLibrary(library)) notFound()

  return Response.json(await loadCode(entry, library), {
    headers: { "X-Robots-Tag": "noindex" },
  })
}
