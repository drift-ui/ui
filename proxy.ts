import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server"

import { countInstall, registryItemName } from "@/lib/install-count"
import {
  componentPath,
  DEFAULT_PRIMITIVE_LIBRARY,
  isPrimitiveLibrary,
  PRIMITIVE_LIBRARY_COOKIE,
} from "@/lib/primitive-library"

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/r/")) {
    const item = registryItemName(pathname)
    if (item) event.waitUntil(countInstall(item))
    return NextResponse.next()
  }

  const slug = pathname.split("/")[2]
  if (isPrimitiveLibrary(slug)) {
    return NextResponse.redirect(new URL("/components", request.url))
  }

  const preferred = request.cookies.get(PRIMITIVE_LIBRARY_COOKIE)?.value
  const library = isPrimitiveLibrary(preferred)
    ? preferred
    : DEFAULT_PRIMITIVE_LIBRARY

  return NextResponse.redirect(
    new URL(componentPath(slug, library), request.url)
  )
}

export const config = {
  matcher: [
    "/components/:slug",
    {
      source: "/r/:path+",
      has: [{ type: "header", key: "user-agent", value: "shadcn" }],
    },
  ],
}
