import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        crt: "#0B0B0B",
        "crt-2": "#131312",
        phos: "#ECECEA",
        muted: "#9F9F9C",
        faint: "#6A6A67",
        rule: "#2A2A27",
        "rule-strong": "#3A3A36",
        hazard: "#E61919",
        signal: "#4AF626"
      },
      fontFamily: {
        display: ["Archivo Black", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "monospace"]
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        pulse2: "pulse2 1.6s steps(1) infinite"
      },
      keyframes: {
        blink: {
          "50%": { opacity: "0.2" }
        },
        pulse2: {
          "50%": { opacity: "0.3" }
        }
      }
    }
  },
  plugins: []
};

export default config;
