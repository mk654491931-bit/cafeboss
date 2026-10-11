/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        espresso: {
          50: "#F4EEE8",
          100: "#E8DCD2",
          200: "#D2BFB1",
          300: "#A98B75",
          400: "#7B5A44",
          500: "#5C3A2A",
          600: "#4A2E23",
          700: "#3E2A1F",
          800: "#2A1C13",
          900: "#1A1614",
        },
        cream: {
          50: "#FDFBF7",
          100: "#F6EFE5",
          200: "#EDE0D4",
          300: "#E2D2C0",
          400: "#CDB9A1",
        },
        caramel: {
          300: "#E0BC97",
          400: "#D2A477",
          500: "#C08552",
          600: "#A66E3F",
          700: "#8A5A33",
        },
        ink: "#1A1614",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -18px rgba(42, 28, 19, 0.35)",
        lift: "0 24px 60px -30px rgba(42, 28, 19, 0.45)",
      },
    },
  },
  plugins: [],
};
