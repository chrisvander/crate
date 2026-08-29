import { defineConfig } from "vite"

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
      "/oauth": {
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
})
