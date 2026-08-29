import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
      react: "preact/compat",
    },
  },
  server: {
    proxy: {
      // string shorthand
      "/api/v1": {
        target: "http://127.0.0.1:3030",
        changeOrigin: true,
        secure: false,
      },
      "/oauth": {
        target: "http://127.0.0.1:3030",
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
