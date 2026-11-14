import type { MetadataRoute } from "next"

import { CATALOG } from "@/lib/catalog"
import {
  componentPath,
  DEFAULT_PRIMITIVE_LIBRARY,
} from "@/lib/primitive-library"
import { RESOURCES, resourcePath } from "@/lib/resources"
import { siteConfig } from "@/lib/site-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const componentRoutes = CATALOG.map((entry) =>
    componentPath(entry.slug, DEFAULT_PRIMITIVE_LIBRARY)
  )

  function toEntry(route: string, lastModified: Date) {
    return {
      url: new URL(route, siteConfig.url).toString(),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.8,
    }
  }

  return [
    ...[...siteConfig.routes, ...componentRoutes].map((route) =>
      toEntry(route, now)
    ),
    ...RESOURCES.map(({ slug, publishedAt }) =>
      toEntry(resourcePath(slug), new Date(publishedAt))
    ),
  ]
}
