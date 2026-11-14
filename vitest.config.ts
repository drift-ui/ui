import { readdirSync } from "node:fs"
import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const baseUiAliases = readdirSync("registry/base/ui").map((file) => ({
  find: `@/registry/default/ui/${path.parse(file).name}`,
  replacement: path.resolve("registry/base/ui", file),
}))

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
    coverage: {
      include: ["registry/**", "lib/**", "components/**"],
      reporter: ["text-summary", "lcov"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "radix",
          include: ["tests/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        resolve: { alias: baseUiAliases },
        test: {
          name: "base",
          include: ["tests/ui/**/*.test.tsx"],
          exclude: ["tests/ui/showcase.test.tsx"],
          env: { UI_PRIMITIVES: "base" },
        },
      },
    ],
  },
})
