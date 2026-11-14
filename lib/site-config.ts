const FALLBACK_SITE_URL = "http://localhost:3000"

function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const vercelHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  if (vercelHost) return `https://${vercelHost}`
  return FALLBACK_SITE_URL
}

export const siteConfig = {
  name: "drift-ui",
  title: "drift-ui, the components shadcn left out",
  description:
    "A shadcn-compatible component registry. Tags input, stepper, tree view, file dropzone and more, built on Radix or Base UI with Tailwind v4 and installed with the shadcn CLI.",
  url: resolveSiteUrl(),
  repo: "https://github.com/drift-ui/ui",
  discord: "https://discord.gg/tJH3dC8Exz",
  keywords: [
    "shadcn",
    "shadcn registry",
    "shadcn components",
    "React components",
    "Radix UI",
    "Base UI",
    "Tailwind CSS v4",
    "Next.js",
    "tags input",
    "stepper",
    "tree view",
    "file dropzone",
  ],
  routes: [
    "/",
    "/components",
    "/blocks",
    "/themes",
    "/contributors",
    "/resources",
  ],
} as const
