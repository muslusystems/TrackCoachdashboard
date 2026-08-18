import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F4F6F5",
          100: "#E4E8E6",
          200: "#C7CFCB",
          400: "#7C8B85",
          600: "#3E4A45",
          800: "#212B27",
          900: "#121815",
        },
        signal: {
          50: "#EEF1FD",
          100: "#D6DCFA",
          400: "#5D6EE8",
          600: "#3947C4",
          800: "#242F8F",
        },
        progress: {
          100: "#E1F0E6",
          500: "#2F855A",
          700: "#1F5E3E",
        },
        pending: {
          100: "#FBEFD9",
          500: "#C08A1E",
          700: "#8C6414",
        },
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
