import {
  TWILIO_REST_AUTHENTICATION_FAILED,
  TWILIO_REST_INVALID_TO_NUMBER,
  TWILIO_REST_UNVERIFIED_TRIAL_TO,
} from "@/lib/constants/twilioErrors"

function isTwilioRestShape(
  error: unknown
): error is { status?: number; code?: number; message?: string } {
  return typeof error === "object" && error !== null && "status" in error
}

function twilioErrorCode(error: { code?: unknown }): number | null {
  if (typeof error.code === "number" && Number.isFinite(error.code)) {
    return error.code
  }
  if (typeof error.code === "string") {
    const n = Number(error.code)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Maps Twilio SDK errors to a short, operator-safe message (no raw API payload).
 */
export function mapTwilioSmsErrorToClientMessage(error: unknown): string {
  if (!isTwilioRestShape(error)) {
    return "SMS delivery failed"
  }

  const { status } = error
  const code = twilioErrorCode(error)

  if (code === TWILIO_REST_AUTHENTICATION_FAILED || status === 401) {
    return "Texting service login failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local (no quotes or spaces), then restart the dev server."
  }

  if (code === TWILIO_REST_INVALID_TO_NUMBER) {
    return "SMS failed to send. Check the mobile number."
  }

  if (code === TWILIO_REST_UNVERIFIED_TRIAL_TO) {
    return "Twilio trial: add this mobile number under Verified Caller IDs in Twilio Console, or upgrade the account."
  }

  return "SMS delivery failed"
}
