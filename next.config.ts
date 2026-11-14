import type { NextConfig } from "next"

import { DEFAULT_STYLE, SHOWCASE_STYLES } from "./lib/style-tokens"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      ...SHOWCASE_STYLES.filter((style) => style !== DEFAULT_STYLE).map(
        (style) => ({
          source: `/r/:style(${style.id}|.+-${style.id})/shape.json`,
          destination: `/r/styles/${style.id}/shape.json`,
        })
      ),
      { source: "/r/:style(base-[^/]+)/:name", destination: "/r/base/:name" },
      { source: "/r/:style/:name", destination: "/r/:name" },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
}

export default nextConfig
