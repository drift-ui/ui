import { ImageResponse } from "next/og"

import { loadOgFonts, OgCommand, OgFrame } from "@/components/seo/og-frame"
import { OG_COLORS } from "@/components/seo/og-logo-mark"
import { CATALOG } from "@/lib/catalog"
import { siteConfig } from "@/lib/site-config"

export const alt = siteConfig.title
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  return new ImageResponse(
    <OgFrame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Display",
          fontSize: 118,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: -5,
        }}
      >
        <span>The components</span>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <span>shadcn left</span>
          <span
            style={{
              padding: "0 18px 10px",
              borderRadius: 20,
              background: OG_COLORS.brandSolid,
              transform: "rotate(7deg)",
            }}
          >
            out
          </span>
        </div>
      </div>
      <span
        style={{
          marginTop: 30,
          marginBottom: 34,
          fontSize: 30,
          color: OG_COLORS.muted,
        }}
      >
        {CATALOG.length} components for the shadcn CLI, on Radix or Base UI
      </span>
      <OgCommand command="npx shadcn add @drift-ui/tags-input" />
    </OgFrame>,
    { ...size, fonts: await loadOgFonts() }
  )
}
