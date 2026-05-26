import {
  PRE_REGISTER_RATE_LIMIT_MAX,
  PRE_REGISTER_RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants/preRegister"

interface RateLimitBucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

/** In-memory per-IP limiter (best-effort on serverless; sufficient for MVP). */
export function checkPreRegisterRateLimit(clientKey: string): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(clientKey)

  if (!existing || now >= existing.resetAt) {
    buckets.set(clientKey, {
      count: 1,
      resetAt: now + PRE_REGISTER_RATE_LIMIT_WINDOW_MS,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (existing.count >= PRE_REGISTER_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return { allowed: false, retryAfterSeconds }
  }

  existing.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) {
      return first
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) {
    return realIp
  }
  return "unknown"
}
