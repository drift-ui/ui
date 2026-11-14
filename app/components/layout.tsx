import { DocsSearch, type SearchGroup } from "@/components/docs/docs-search"
import { MotionProvider } from "@/components/landing/motion-provider"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { CATALOG, CATEGORIES } from "@/lib/catalog"

const SEARCH_GROUPS: SearchGroup[] = CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  entries: CATALOG.filter((entry) => entry.category === category.id).map(
    ({ slug, name, description }) => ({ slug, name, description })
  ),
}))

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <MotionProvider>
        <SiteNav search={<DocsSearch groups={SEARCH_GROUPS} />} />
        {children}
        <SiteFooter />
      </MotionProvider>
    </div>
  )
}
