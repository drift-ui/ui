import { existsSync } from "node:fs"
import { join } from "node:path"

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import { describe, expect, it } from "vitest"

import { DocSection } from "@/components/docs/doc-section"
import { createPageMetadata } from "@/lib/page-metadata"
import {
  findResource,
  headingId,
  nextResource,
  RESOURCE_TAGS,
  RESOURCES,
  resourceOutline,
  resourceSearchText,
  resourceTagPath,
} from "@/lib/resources"
import { siteConfig } from "@/lib/site-config"

describe("resources", () => {
  it("builds anchor ids from headings", () => {
    expect(headingId("Why we're building it in the open")).toBe(
      "why-we-re-building-it-in-the-open"
    )
  })

  it("derives an outline from section headings", () => {
    const post = findResource("building-drift-ui-in-the-open")!

    expect(resourceOutline(post)).toContainEqual({
      id: "what-drift-ui-is",
      label: "What drift-ui is",
    })
  })

  it("lists posts newest first", () => {
    const dates = RESOURCES.map(({ publishedAt }) => publishedAt)

    expect(dates).toEqual([...dates].sort().reverse())
  })

  it("gives every post a TL;DR", () => {
    for (const { slug, tldr } of RESOURCES) {
      expect(tldr.length, slug).toBeGreaterThan(0)
    }
  })

  it("credits every post to a maintainer", () => {
    for (const { slug, author } of RESOURCES) {
      expect(author.login, slug).toBe("localhostd3veloper")
    }
  })

  it("tags every post, and every tag has a post", () => {
    for (const { slug, tags } of RESOURCES) {
      expect(tags.length, slug).toBeGreaterThan(0)
    }
    for (const tag of RESOURCE_TAGS) {
      expect(
        RESOURCES.some(({ tags }) => tags.includes(tag)),
        tag
      ).toBe(true)
    }
  })

  it("links a tag to the filtered list", () => {
    expect(resourceTagPath("Open source")).toBe("/resources?tag=Open%20source")
  })

  it("searches the author, tags and TL;DR as well as the title", () => {
    const text = resourceSearchText(findResource("what-is-open-source")!)

    expect(text).toContain("gautam anand")
    expect(text).toContain("localhostd3veloper")
    expect(text).toContain("students")
    expect(text).toContain("hacktoberfest")
  })

  it("keeps search titles and descriptions short enough to show in full", () => {
    for (const { title, description } of RESOURCES) {
      expect(`${title} | ${siteConfig.name}`.length, title).toBeLessThanOrEqual(
        60
      )
      expect(description.length, title).toBeLessThanOrEqual(160)
    }
  })

  it("shares each post with its cover as an article", () => {
    const [{ title, description, slug, publishedAt, image }] = RESOURCES
    const { openGraph, twitter } = createPageMetadata({
      title,
      description,
      path: `/resources/${slug}`,
      cover: image,
      publishedTime: publishedAt,
    })

    expect(openGraph).toMatchObject({
      type: "article",
      publishedTime: publishedAt,
      images: [{ url: image?.src, alt: image?.alt }],
    })
    expect(twitter).toMatchObject({ images: [{ url: image?.src }] })
  })

  it("keeps outline ids unique within a post", () => {
    for (const resource of RESOURCES) {
      const ids = resourceOutline(resource).map(({ id }) => id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it("points every outline link at a section in the post", () => {
    for (const resource of RESOURCES) {
      if (!resource.Content) continue
      const article = (
        resource.Content as () => ReactElement<{
          children: ReactNode
        }>
      )()
      const sectionIds = Children.toArray(article.props.children).flatMap(
        (child) =>
          isValidElement<{ id?: string }>(child) && child.type === DocSection
            ? [child.props.id]
            : []
      )

      expect(sectionIds, resource.slug).toEqual(
        resourceOutline(resource).map(({ id }) => id)
      )
    }
  })

  it("points every post at an existing cover image", () => {
    for (const { image } of RESOURCES) {
      if (image) expect(existsSync(join("public", image.src))).toBe(true)
    }
  })

  it("wraps from the last post to the first", () => {
    expect(nextResource(RESOURCES.at(-1)!.slug)).toBe(RESOURCES[0])
  })
})
