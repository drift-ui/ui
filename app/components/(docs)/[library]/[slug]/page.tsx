import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ApiReference } from "@/components/docs/api-reference"
import { CodeFrame } from "@/components/docs/code-frame"
import { ComponentExamples } from "@/components/docs/component-examples"
import { ComponentHeader } from "@/components/docs/component-header"
import { DocSection } from "@/components/docs/doc-section"
import { InstallPanel } from "@/components/docs/install-panel"
import {
  OnThisPage,
  OnThisPageDisclosure,
} from "@/components/docs/on-this-page"
import { Pager } from "@/components/docs/pager"
import { PreviewStage } from "@/components/docs/preview-stage"
import { PreviewTabs } from "@/components/docs/preview-tabs"
import { SourceFiles } from "@/components/docs/source-files"
import { JsonLd } from "@/components/seo/json-ld"
import { COMPONENT_API } from "@/lib/agent-docs/component-api"
import { COMPONENT_USAGE } from "@/lib/agent-docs/component-usage"
import { toBaseUiItem } from "@/lib/base-ui-registry"
import {
  CATALOG,
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
  const { previous, next } = findNeighbors(entry.slug)
  const sections = [
    { id: "installation", label: "Installation" },
    ...(snippet ? [{ id: "usage", label: "Usage" }] : []),
    ...(examples.length > 0
      ? [
          { id: "examples", label: "Examples" },
          ...examples.map(({ id, title }) => ({
            id,
            label: title,
            isNested: true,
          })),
        ]
      : []),
    ...(api ? [{ id: "api", label: "API reference" }] : []),
    { id: "source", label: "Source" },
  ]

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_10rem] xl:gap-12">
      <main className="flex max-w-4xl min-w-0 flex-col gap-16">
        <JsonLd schema={buildComponentSchema(entry, library)} />
        <ComponentHeader entry={entry} library={library} />
        <div className="-mt-4">
          <PreviewTabs
            preview={<PreviewStage entry={entry} library={library} />}
            usage={usage}
          />
        </div>
        <OnThisPageDisclosure sections={sections} className="-mt-8 xl:hidden" />
        <DocSection id="installation" title="Installation">
          <InstallPanel
            slug={entry.slug}
            dependencies={source.dependencies}
            buildsOn={resolveBuildsOn(entry, library)}
            installPaths={listInstallPaths(source)}
          />
        </DocSection>
        {snippet && (
          <DocSection id="usage" title="Usage">
            <CodeFrame {...snippet} collapsible />
          </DocSection>
        )}
        {examples.length > 0 && (
          <DocSection id="examples" title="Examples">
            <ComponentExamples examples={examples} />
          </DocSection>
        )}
        {api && (
          <DocSection id="api" title="API reference">
            <ApiReference parts={api} />
          </DocSection>
        )}
        <DocSection id="source" title="Source">
          <SourceFiles files={sources} />
        </DocSection>
        <Pager previous={previous} next={next} library={library} />
      </main>
      <aside className="hidden xl:block">
        <OnThisPage
          sections={sections}
          sourceUrl={`${siteConfig.repo}/blob/main/${source.files[0]?.path}`}
        />
      </aside>
    </div>
  )
}
