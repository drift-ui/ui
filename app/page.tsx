import { AgentsSection } from "@/components/landing/agents-section"
import { CatalogBand } from "@/components/landing/catalog-band"
import { ClosingCta } from "@/components/landing/closing-cta"
import { CommunitySection } from "@/components/landing/community-section"
import { FitSection } from "@/components/landing/fit-section"
import { Hero } from "@/components/landing/hero"
import { MotionProvider } from "@/components/landing/motion-provider"
import { InstallSection } from "@/components/landing/install-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { SmoothScroll } from "@/components/landing/smooth-scroll"
import { JsonLd } from "@/components/seo/json-ld"
import { siteConfig } from "@/lib/site-config"

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/brand/exports/drift-ui-avatar-1024.png`,
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <JsonLd schema={WEBSITE_SCHEMA} />
      <MotionProvider>
        <SmoothScroll>
          <SiteNav />
          <main>
            <Hero />
            <FitSection />
            <CatalogBand />
            <InstallSection />
            <AgentsSection />
            <CommunitySection />
            <ClosingCta />
          </main>
          <SiteFooter />
        </SmoothScroll>
      </MotionProvider>
    </div>
  )
}
