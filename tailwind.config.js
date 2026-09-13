/** @type {import('tailwindcss').Config} */
module.exports = {
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
      },
    },
  },
  plugins: [],
};
