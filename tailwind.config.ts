import type { Config } from "tailwindcss"

/**
 * Tailwind v4 primarily reads theme from `app/globals.css` (`@theme`).
 * This file keeps the same breakpoints in one place for tooling and docs.
 */
export default {
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
  },
} satisfies Config
