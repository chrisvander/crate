import forms from "@tailwindcss/forms"
import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        iaQuattro: ["iA Quattro", "sans-serif"],
      },
    },
  },
  plugins: [forms],
} satisfies Config
