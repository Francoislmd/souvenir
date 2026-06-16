import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        brand: "var(--brand)",
        "brand-hover": "var(--brand-hover)",
        "brand-tint": "var(--brand-tint)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-tint": "var(--accent-tint)",
        success: "var(--success)",
        "success-tint": "var(--success-tint)",
        warning: "var(--warning)",
        "warning-tint": "var(--warning-tint)",
        danger: "var(--danger)",
        "danger-tint": "var(--danger-tint)",
      },
      borderRadius: {
        card: "20px",
        control: "12px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-bricolage)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
