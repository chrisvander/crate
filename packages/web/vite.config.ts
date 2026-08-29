import { defineConfig } from "vite"
import preact from "@preact/preset-vite"
import mdPlugin, { Mode } from "vite-plugin-markdown"

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // string shorthand
      "/api/v1": {
        target: "http://localhost:3030",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "preact",
    },
    define: {
      this: "window",
    },
  },
  plugins: [
    preact(),
    mdPlugin({
      mode: [Mode.HTML, Mode.REACT],
    }),
  ],
})
