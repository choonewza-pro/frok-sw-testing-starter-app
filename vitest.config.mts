import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "@generated": path.resolve(root, "generated"),
    },
  },
  test: {
    environment: "jsdom",         // ค่าเริ่มต้นของทุกไฟล์: มี document/window
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "generated/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.ts", "src/app/(front)/components/**/*.tsx"],
      exclude: ["src/lib/prisma.ts", "src/lib/auth.ts", "src/lib/auth-client.ts"],
    },
  },
})