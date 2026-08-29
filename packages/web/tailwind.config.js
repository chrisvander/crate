module.exports = {
  content: ["packages/web/index.html", "packages/web/src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        iaQuattro: ["iA Quattro", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
