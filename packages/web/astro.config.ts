import { defineConfig } from "astro/config"
import preact from "@astrojs/preact"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  integrations: [preact()],
  output: "static",
  outDir: "../../dist/packages/web",
  server: { host: "127.0.0.1", port: 5173 },
  vite: {
    plugins: [tailwindcss()],
    environments: { prerender: { resolve: { noExternal: ["preact"] } } },
    server: {
      strictPort: true,
      proxy: {
        "/api": "http://127.0.0.1:3030",
        "/oauth": "http://127.0.0.1:3030",
        "/oauth-client-metadata.json": "http://127.0.0.1:3030",
        "/health": "http://127.0.0.1:3030",
      },
    },
  },
})
