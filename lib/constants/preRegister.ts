/** Max submissions per client IP within the rate-limit window. */
export const PRE_REGISTER_RATE_LIMIT_MAX = 5

/** Rate-limit window in milliseconds (15 minutes). */
export const PRE_REGISTER_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

/** Marker stored on `tickets.device_id` for web pre-registrations. */
export const PRE_REGISTER_DEVICE_ID = "web-pre-register"
