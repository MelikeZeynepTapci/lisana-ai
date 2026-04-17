import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C5CBF",
          dim: "#6B4DAE",
          container: "#F3EFFC",
          fixed: "#EAE0FB",
          "fixed-dim": "#F3EFFC",
        },
        secondary: {
          DEFAULT: "#2A9D7C",
          container: "#EEF9F5",
          "on-container": "#1a6b52",
        },
        tertiary: {
          DEFAULT: "#4ECBA8",
          container: "#EEF9F5",
          "on-container": "#2A9D7C",
        },
        surface: {
          DEFAULT: "#F7F7F8",
          low: "#F2F2F4",
          high: "#EBEBED",
          highest: "#E3E3E6",
          lowest: "#FFFFFF",
        },
        "on-surface": "#1B1F3B",
        "on-surface-variant": "#5A5F7A",
        "on-primary": "#ffffff",
        "on-tertiary": "#ffffff",
        error: {
          DEFAULT: "#E8437A",
          container: "#FEE8EF",
        },
        "outline-variant": "#D0D1DC",
        background: "#F7F7F8",
        "yellow-pale": "#FAFADC",
      },
      fontFamily: {
        lexend: ["var(--font-lexend)", "Georgia", "serif"],
        manrope: ["var(--font-manrope)", "sans-serif"],
        lora: ["var(--font-lora)", "Georgia", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "3rem",
      },
      boxShadow: {
        ambient: "0 20px 40px -10px rgba(27, 31, 59, 0.08)",
        "ambient-sm": "0 8px 24px -6px rgba(27, 31, 59, 0.06)",
        "ambient-lg": "0 32px 64px -12px rgba(27, 31, 59, 0.14)",
        "ambient-xl": "0 40px 80px -16px rgba(27, 31, 59, 0.18)",
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
