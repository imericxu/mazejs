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
        primary: {
          light: "hsl(var(--color-primary-light) / <alpha-value>)",
          DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
        },
        secondary: "hsl(var(--color-secondary) / <alpha-value>)",
        disabled: "hsl(var(--color-disabled) / <alpha-value>)",
        error: "hsl(var(--color-error) / <alpha-value>)",
        surface: {
          overlay: "hsl(var(--color-surface-overlay))",
          DEFAULT: "hsl(var(--color-surface) / <alpha-value>)",
        },
        text: {
          placeholder: "hsl(var(--color-text-placeholder) / <alpha-value>)",
          disabled: "hsl(var(--color-text-disabled) / <alpha-value>)",
          DEFAULT: "hsl(var(--color-text) / <alpha-value>)",
        },
        border: "hsl(var(--color-border) / <alpha-value>)",
      },
    },
  },
  plugins: [require("tailwindcss-react-aria-components")],
};
export default config;
