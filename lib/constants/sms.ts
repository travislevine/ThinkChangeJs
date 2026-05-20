/** After a successful SMS send, the UI stays in the "sent" state this long before returning to idle. */
export const SMS_SENT_STATUS_RESET_MS = 8000

/** Delay before auto-sending patron SMS after drop-off check-in or pick-up. */
export const AUTO_PATRON_SMS_DELAY_MS = 3_000

/** @deprecated Use {@link AUTO_PATRON_SMS_DELAY_MS}. */
export const DROP_OFF_CHECKED_IN_SMS_DELAY_MS = AUTO_PATRON_SMS_DELAY_MS

/** Placeholder until the real BikePark rating Google Form URL is configured. */
export const BIKEPARK_RATING_SURVEY_URL = "https://tinyurl.com/Bike-Park-App"