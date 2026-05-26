import { NextResponse } from "next/server"

import { isSupabaseAdminConfigured } from "@/lib/server/supabaseAdmin"
import {
  checkPreRegisterRateLimit,
  getClientIp,
} from "@/lib/server/rateLimitPreRegister"
import {
  createPreRegistration,
  fetchActiveEventForPreRegister,
} from "@/lib/server/createPreRegistration"
import { logRouteHandlerError } from "@/lib/server/routeErrorLog"
import type {
  PreRegisterErrorResponse,
  PreRegisterStatusResponse,
  PreRegisterSubmitRequest,
  PreRegisterSubmitSuccessResponse,
} from "@/lib/types/preRegister"

function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  const payload: PreRegisterErrorResponse = {
    error: "Too many requests. Please try again later.",
  }
  return NextResponse.json(payload, {
    status: 429,
    headers: { "Retry-After": String(retryAfterSeconds) },
  })
}

export async function GET(request: Request): Promise<NextResponse> {
  const limit = checkPreRegisterRateLimit(`get:${getClientIp(request)}`)
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfterSeconds)
  }

  if (!isSupabaseAdminConfigured()) {
    const payload: PreRegisterStatusResponse = { open: false, eventName: null }
    return NextResponse.json(payload, { status: 200 })
  }

  try {
    const event = await fetchActiveEventForPreRegister()
    const payload: PreRegisterStatusResponse = {
      open: event !== null,
      eventName: event?.name ?? null,
    }
    return NextResponse.json(payload, { status: 200 })
  } catch (error: unknown) {
    logRouteHandlerError("pre-register-get", error)
    const payload: PreRegisterStatusResponse = { open: false, eventName: null }
    return NextResponse.json(payload, { status: 200 })
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseSubmitBody(body: unknown): PreRegisterSubmitRequest | null {
  if (!isRecord(body)) {
    return null
  }

  const patronName = body.patronName
  if (typeof patronName !== "string") {
    return null
  }

  let mobile: string | undefined
  if (body.mobile !== undefined && body.mobile !== null) {
    if (typeof body.mobile !== "string") {
      return null
    }
    mobile = body.mobile
  }

  let email: string | undefined
  if (body.email !== undefined && body.email !== null) {
    if (typeof body.email !== "string") {
      return null
    }
    email = body.email
  }

  let notes: string | undefined
  if (body.notes !== undefined && body.notes !== null) {
    if (typeof body.notes !== "string") {
      return null
    }
    notes = body.notes
  }

  return {
    patronName,
    mobile,
    email,
    notes,
    devices: body.devices as PreRegisterSubmitRequest["devices"],
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const limit = checkPreRegisterRateLimit(`post:${getClientIp(request)}`)
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfterSeconds)
  }

  if (!isSupabaseAdminConfigured()) {
    const payload: PreRegisterErrorResponse = {
      error: "Registration is unavailable. Please try again later.",
    }
    return NextResponse.json(payload, { status: 503 })
  }

  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    const payload: PreRegisterErrorResponse = { error: "Invalid request body." }
    return NextResponse.json(payload, { status: 400 })
  }

  const body = parseSubmitBody(parsed)
  if (!body) {
    const payload: PreRegisterErrorResponse = { error: "Invalid request body." }
    return NextResponse.json(payload, { status: 400 })
  }

  try {
    const result = await createPreRegistration(body)
    if (!result.ok) {
      const payload: PreRegisterErrorResponse = { error: result.error }
      return NextResponse.json(payload, { status: result.status })
    }

    const payload: PreRegisterSubmitSuccessResponse = {
      success: true,
      smsSent: result.smsSent,
    }
    return NextResponse.json(payload, { status: 200 })
  } catch (error: unknown) {
    logRouteHandlerError("pre-register-post", error)
    const payload: PreRegisterErrorResponse = {
      error: "Registration failed. Please try again.",
    }
    return NextResponse.json(payload, { status: 500 })
  }
}
