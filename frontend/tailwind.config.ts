import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#725991",
          dim: "#664d84",
          container: "#dbbdfd",
          fixed: "#f3daff",
          "fixed-dim": "#dbbdfd",
        },
        secondary: {
          DEFAULT: "#8c5900",
          container: "#ffddb6",
          "on-container": "#734900",
        },
        tertiary: {
          DEFAULT: "#22705f",
          container: "#a0ecd5",
          "on-container": "#004d3c",
        },
        surface: {
          DEFAULT: "#FAF6EE",
          low: "#fafcda",
          high: "#eff1c9",
          highest: "#e7edb1",
          lowest: "#ffffff",
        },
        "on-surface": "#363b10",
        "on-surface-variant": "#626838",
        "on-primary": "#ffffff",
        "on-tertiary": "#ffffff",
        error: {
          DEFAULT: "#b3374e",
          container: "#ffdad9",
        },
        "outline-variant": "#b8be86",
        background: "#FAF6EE",
      },
      fontFamily: {
        lexend: ["var(--font-lexend)", "Lexend", "sans-serif"],
        manrope: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "3rem",
      },
      boxShadow: {
        ambient: "0 20px 40px -10px rgba(54, 59, 16, 0.08)",
        "ambient-sm": "0 8px 24px -6px rgba(54, 59, 16, 0.06)",
        "ambient-lg": "0 32px 64px -12px rgba(54, 59, 16, 0.14)",
        "ambient-xl": "0 40px 80px -16px rgba(54, 59, 16, 0.18)",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1.6)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        wave: "wave 1.2s ease-in-out infinite",
        "fade-up": "fade-up 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
