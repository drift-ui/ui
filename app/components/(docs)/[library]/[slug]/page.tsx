import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ApiReference } from "@/components/docs/api-reference"
import { CodeFrame } from "@/components/docs/code-frame"
import { ComponentExamples } from "@/components/docs/component-examples"
import type { NavGroup } from "@/components/docs/component-nav-list"
import { ComponentHeader } from "@/components/docs/component-header"
import { ComponentSwitcher } from "@/components/docs/component-switcher"
import { InstallPanel } from "@/components/docs/install-panel"
import { KeyboardStrip } from "@/components/docs/keyboard-strip"
import { PreviewStage } from "@/components/docs/preview-stage"
import { PreviewTabs } from "@/components/docs/preview-tabs"
import { SourceFiles } from "@/components/docs/source-files"
import { Workbench, type WorkbenchPanel } from "@/components/docs/workbench"
import { JsonLd } from "@/components/seo/json-ld"
import { COMPONENT_API } from "@/lib/agent-docs/component-api"
import { COMPONENT_USAGE } from "@/lib/agent-docs/component-usage"
import { toBaseUiItem } from "@/lib/base-ui-registry"
import { COMPONENT_KEYBOARD } from "@/lib/component-keyboard"
import {
  CATALOG,
  CATEGORIES,
  findCategory,
  findEntry,
  findNeighbors,
  type CatalogEntry,
} from "@/lib/catalog"
import {
  listInstallPaths,
  loadExamples,
  loadSources,
  loadUsage,
  loadUsageSnippet,
  resolveBuildsOn,
} from "@/lib/component-docs"
import { createPageMetadata } from "@/lib/page-metadata"
import {
  componentPath,
  isPrimitiveLibrary,
  PRIMITIVE_LIBRARIES,
  registryItemPath,
  type PrimitiveLibrary,
} from "@/lib/primitive-library"
import { siteConfig } from "@/lib/site-config"

const NAV_GROUPS: NavGroup[] = CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  entries: CATALOG.filter((entry) => entry.category === category.id).map(
    ({ slug, name }) => ({ slug, name })
  ),
}))

type ComponentPageProps = {
  params: Promise<{ library: string; slug: string }>
}

function buildComponentSchema(entry: CatalogEntry, library: PrimitiveLibrary) {
  const pageUrl = `${siteConfig.url}${componentPath(entry.slug, library)}`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Components",
            item: `${siteConfig.url}/components`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: entry.name,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "SoftwareSourceCode",
        name: `${entry.name} for shadcn/ui`,
        description: entry.description,
        url: pageUrl,
        codeRepository: `${siteConfig.url}${registryItemPath(entry.slug, library)}`,
        programmingLanguage: ["TypeScript", "React"],
        runtimePlatform: "React",
        keywords: [
          "shadcn",
          findCategory(entry.category)?.label,
          entry.name,
        ].filter(Boolean),
        isPartOf: {
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
        },
      },
    ],
  }
}

export const dynamicParams = false

export function generateStaticParams() {
  return PRIMITIVE_LIBRARIES.flatMap(({ value }) =>
    CATALOG.map((entry) => ({ library: value, slug: entry.slug }))
  )
}

export async function generateMetadata({
  params,
}: ComponentPageProps): Promise<Metadata> {
  const { library, slug } = await params
  const entry = findEntry(slug)
  if (!entry || !isPrimitiveLibrary(library)) return {}

  const path = componentPath(entry.slug, library)

  return createPageMetadata({
    title: entry.name,
    description: `${entry.description} Install with npx shadcn@latest add @drift-ui/${entry.slug}.`,
    path,
    imageBasePath: path,
    imageAlt: `${entry.name}, a ${siteConfig.name} component for shadcn/ui`,
  })
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  const { library, slug } = await params
  const entry = findEntry(slug)
  if (!entry || !isPrimitiveLibrary(library)) notFound()

  const source = library === "base" ? toBaseUiItem(entry) : entry
  const usageEntry = COMPONENT_USAGE[entry.slug]
  const usageExample =
    (library === "base" && usageEntry?.baseExample) || usageEntry?.example
  const [usage, sources, snippet, examples] = await Promise.all([
    loadUsage(entry, library),
    loadSources(source),
    usageExample && loadUsageSnippet(entry, usageExample),
    loadExamples(entry.slug, library),
  ])
  const api = COMPONENT_API[entry.slug]
  const keyboard = COMPONENT_KEYBOARD[entry.slug]
  const { previous, next } = findNeighbors(entry.slug)
  const panels: WorkbenchPanel[] = [
    {
      value: "installation",
      label: "Install",
      content: (
        <InstallPanel
          slug={entry.slug}
          dependencies={source.dependencies}
          buildsOn={resolveBuildsOn(entry, library)}
          installPaths={listInstallPaths(source)}
        />
      ),
    },
    ...(snippet
      ? [
          {
            value: "usage",
            label: "Usage",
            content: <CodeFrame {...snippet} collapsible />,
          },
        ]
      : []),
    ...(api
      ? [{ value: "api", label: "API", content: <ApiReference parts={api} /> }]
      : []),
    ...(examples.length > 0
      ? [
          {
            value: "examples",
            label: `Examples ${examples.length}`,
            content: <ComponentExamples examples={examples} />,
          },
        ]
      : []),
    {
      value: "source",
      label: "Source",
      content: <SourceFiles files={sources} />,
    },
  ]

  return (
    <main className="flex flex-col gap-5 py-6 lg:py-8">
      <JsonLd schema={buildComponentSchema(entry, library)} />
      <ComponentHeader
        entry={entry}
        library={library}
        sourceUrl={`${siteConfig.repo}/blob/main/${source.files[0]?.path}`}
        switcher={
          <ComponentSwitcher
            groups={NAV_GROUPS}
            position={CATALOG.indexOf(entry) + 1}
            total={CATALOG.length}
            categoryLabel={findCategory(entry.category)?.label}
            previous={previous && { slug: previous.slug, name: previous.name }}
            next={next && { slug: next.slug, name: next.name }}
            library={library}
          />
        }
      />
      <Workbench
        panels={panels}
        preview={
          <>
            <PreviewTabs
              preview={<PreviewStage entry={entry} library={library} />}
              usage={usage}
            />
            {keyboard && (
              <div className="shrink-0 border-t bg-muted/30 px-4 py-2.5">
                <KeyboardStrip bindings={keyboard} />
              </div>
            )}
          </>
        }
      />
    </main>
  )
}
