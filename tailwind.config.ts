import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bx: {
          lime: "#C0D725",
          "lime-hover": "#AEC41D",
          cyan: "#3299A8",
          "cyan-dark": "#277A87",
          "slate-dark": "#1F242B",
          surface: "#F5F7F9",
          card: "#FFFFFF",
        },
        raf: {
          green: "#10B981",
          yellow: "#F59E0B",
          orange: "#F97316",
          red: "#EF4444",
        },
      },
      fontFamily: {
        serif: ["var(--font-arvo)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        bx: "10px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 6px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
