import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
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
          200: "#B4BEF6",
          300: "#8D9BF0",
          400: "#5D6EE8",
          500: "#4757D6",
          600: "#3947C4",
          700: "#2E3AA6",
          800: "#242F8F",
          900: "#1A2270",
        },
        night: {
          700: "#2A2F6B",
          800: "#1E2255",
          900: "#151841",
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
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,24,65,0.04), 0 6px 20px -8px rgba(21,24,65,0.12)",
        pop: "0 20px 50px -12px rgba(21,24,65,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
