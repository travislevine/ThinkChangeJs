/** Minimum viewport width (px) for each named breakpoint. Matches Tailwind `sm:` … `xl:`. */
export const BREAKPOINT_MIN_PX = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

/** `xs` = below `sm` (< 640px). */
export type BreakpointName = "xs" | keyof typeof BREAKPOINT_MIN_PX

/** Minimum touch target (px) for interactive controls. */
export const MIN_TOUCH_TARGET_PX = 44

/**
 * Default stats / device grid column counts by breakpoint.
 * Pattern: 1 col (small) → 2 cols (md) → 4 cols (lg+).
 */
export const GRID_COLUMNS_BY_BREAKPOINT: Record<BreakpointName, 1 | 2 | 4> = {
  xs: 1,
  sm: 1,
  md: 2,
  lg: 4,
  xl: 4,
}
