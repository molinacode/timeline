/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          100: "#2b080b",
          400: "#ac202e",
          500: "#d62839",
          800: "#efa9b0",
        },
        cerulean: {
          400: "#6fb5cf",
          500: "#4ba3c3",
          700: "#29647a",
          900: "#0e2129",
        },
        mint: {
          400: "#5eead4",
          500: "#06d6a0",
          600: "#059669",
        },
        slate: {
          950: "#020617",
        },
      },
      fontFamily: {
        heading: ["Aleo", "Georgia", "serif"],
        body: ["Open Sans", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(75, 163, 195, 0.25), transparent 50%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(6, 214, 160, 0.12), transparent 40%), radial-gradient(ellipse 50% 30% at 20% 30%, rgba(214, 40, 57, 0.1), transparent 40%)",
        "bias-bar":
          "linear-gradient(90deg, #06d6a0 0%, #4ba3c3 50%, #d62839 100%)",
      },
    },
  },
  plugins: [],
}