import type { Metadata } from "next"

import { MotionProvider } from "@/components/landing/motion-provider"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { ShowcaseCanvas } from "@/components/showcase/showcase-canvas"
import { ShowcaseWorkbench } from "@/components/showcase/showcase-workbench"
import { CATALOG } from "@/lib/catalog"
import { createPageMetadata } from "@/lib/page-metadata"
import { SHARE_PARAM } from "@/lib/showcase-share"

export const metadata: Metadata = createPageMetadata({
  title: "Themes",
  description:
    "Try every drift-ui component in your own theme. Pick a preset or paste your shadcn globals.css and the whole set restyles to match.",
  path: "/themes",
})

export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sharedCode = (await searchParams)[SHARE_PARAM]

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <MotionProvider>
        <SiteNav />
        <main className="mx-auto flex w-full max-w-[110rem] flex-1 flex-col gap-8 px-2 pt-10 pb-24 md:px-4">
          <header className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-2 md:px-10">
            <h1 className="rise font-display text-5xl leading-[0.92] font-semibold tracking-[-0.045em] md:text-7xl">
              Themes
            </h1>
            <p className="max-w-[78ch] rise text-muted-foreground [--rise-delay:80ms]">
              Try all {CATALOG.length} components in your style and theme before
              you install.
            </p>
          </header>
          <ShowcaseWorkbench
            sharedCode={typeof sharedCode === "string" ? sharedCode : undefined}
          >
            <ShowcaseCanvas />
          </ShowcaseWorkbench>
        </main>
        <SiteFooter />
      </MotionProvider>
    </div>
  )
}
