module.exports = {
  content: ["./index.html", "./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        iaQuattro: ["iA Quattro", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
