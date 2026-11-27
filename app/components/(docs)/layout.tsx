import { DocsMobileNav } from "@/components/docs/docs-mobile-nav"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import type { NavGroup } from "@/components/docs/component-nav-list"
import { CATALOG, CATEGORIES } from "@/lib/catalog"

const NAV_GROUPS: NavGroup[] = CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  entries: CATALOG.filter((entry) => entry.category === category.id).map(
    ({ slug, name }) => ({ slug, name })
  ),
}))

export default function ComponentDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DocsMobileNav groups={NAV_GROUPS} className="lg:hidden" />
      <div className="mx-auto grid w-full max-w-7xl flex-1 px-4 md:px-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 xl:gap-20">
        <aside className="hidden lg:block">
          <DocsSidebar groups={NAV_GROUPS} />
        </aside>
        <div className="min-w-0 pt-10 pb-24 lg:pt-12">{children}</div>
      </div>
    </>
  )
}
