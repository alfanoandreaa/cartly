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
        lime: "#C8FF00",
        coral: "#FF6B6B",
        muted: "#A3A3A3",
        line: "#2E2E2E"
      },
      boxShadow: {
        glow: "0 0 40px rgba(200,255,0,.12)",
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
