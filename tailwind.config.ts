import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        abyss: "#06070b",
        graphite: "#10141c",
        panel: "rgba(15, 23, 42, 0.58)",
        cyanGlow: "#20f6ff",
        amberWarn: "#ffb020",
        redAlert: "#ff415f",
        mint: "#42ffbf"
      },
      boxShadow: {
        neon: "0 0 32px rgba(32, 246, 255, 0.26)",
        panel: "0 20px 80px rgba(0, 0, 0, 0.35)"
      },
      backgroundImage: {
        "radar-grid":
          "linear-gradient(rgba(32,246,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(32,246,255,0.07) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
