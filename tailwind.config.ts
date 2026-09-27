import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        mhp: {
          bg: "#080C14",
          surface: "#0D1322",
          card: "#121A2D",
          border: "#1E2A44",
          blue: {
            DEFAULT: "#0066FF",
            glow: "#0080FF",
            dark: "#0047B3",
          },
          cyan: {
            DEFAULT: "#00D2FF",
            glow: "#38BDF8",
          },
          silver: {
            DEFAULT: "#E2E8F0",
            muted: "#94A3B8",
            dim: "#64748B",
          }
        }
      },
      boxShadow: {
        "mhp-glow": "0 0 25px -5px rgba(0, 102, 255, 0.35)",
        "mhp-cyan-glow": "0 0 20px -5px rgba(0, 210, 255, 0.4)",
        "mhp-card": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }
    },
  },
  plugins: [],
};
export default config;
