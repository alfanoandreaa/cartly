import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F0F0F",
        surface: "#1A1A1A",
        card: "#232323",
        // The accent ("fluo yellow" by default) is driven by a CSS variable so
        // it can be re-themed at runtime. The <alpha-value> placeholder keeps
        // Tailwind opacity modifiers (bg-lime/10, text-lime/30, …) working.
        lime: "rgb(var(--accent-rgb, 200 255 0) / <alpha-value>)",
        coral: "#FF6B6B",
        muted: "#A3A3A3",
        line: "#2E2E2E"
      },
      boxShadow: {
        glow: "0 0 40px rgb(var(--accent-rgb, 200 255 0) / .12)",
        card: "0 18px 50px rgba(0,0,0,.28)"
      },
      animation: {
        "pulse-soft": "pulse 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
