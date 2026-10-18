/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: "#4C6B3F",
        soil: "#2B2318",
        gold: "#D4A03C",
        darkbg: "#14110e",
        darkcard: "#1e1913",
        darkborder: "#2e261d",
      },
    },
  },
  plugins: [],
};
