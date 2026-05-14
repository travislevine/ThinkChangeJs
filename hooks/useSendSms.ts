"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"
import { SMS_SENT_STATUS_RESET_MS } from "@/lib/constants/sms"
import { TOAST_DURATION_SMS_MS } from "@/lib/constants/toastDurations"
import { appendSmsNote } from "@/lib/smsNotes"
import type {
  SendSmsStatus,
  SendSmsSuccessResponse,
  UseSendSmsResult,
} from "@/lib/types/sendSms"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isSendSmsSuccessResponse(value: unknown): value is SendSmsSuccessResponse {
  return isRecord(value) && value.success === true && typeof value.sid === "string"
}

function readSendSmsErrorToastMessage(payload: unknown): string {
  if (!isRecord(payload)) {
    return "SMS failed to send. Check the mobile number."
  }
  const err = payload.error
  if (typeof err === "string" && err.trim().length > 0) {
    return err.trim()
  }
  return "SMS failed to send. Check the mobile number."
}

const smsToastOptions = { duration: TOAST_DURATION_SMS_MS } as const

export function useSendSms(ticketId: string): UseSendSmsResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const { success, error: toastError } = useToast()

  const [status, setStatus] = React.useState<SendSmsStatus>("idle")
  const statusRef = React.useRef<SendSmsStatus>("idle")
  const idleAfterSentRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = React.useRef(false)

  React.useEffect(() => {
    statusRef.current = status
  }, [status])

  React.useEffect(() => {
    return () => {
      if (idleAfterSentRef.current !== null) {
        clearTimeout(idleAfterSentRef.current)
        idleAfterSentRef.current = null
      }
    }
  }, [])

  const sendSms = React.useCallback(
    async (to: string, ticketNumber: number, patronName: string | null): Promise<void> => {
      if (!eventId) {
        toastError("Select an event before sending SMS.", smsToastOptions)
        return
      }

      if (inFlightRef.current) {
        return
      }
      if (statusRef.current === "sending" || statusRef.current === "sent") {
        return
      }

      inFlightRef.current = true
      setStatus("sending")

      try {
        const response = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, ticketNumber, patronName }),
        })

        const payload: unknown = await response.json().catch(() => null)

        if (!response.ok || !isSendSmsSuccessResponse(payload)) {
          setStatus("error")
          toastError(readSendSmsErrorToastMessage(payload), smsToastOptions)
          setTimeout(() => {
            setStatus("idle")
            statusRef.current = "idle"
          }, 0)
          return
        }

        try {
          await appendSmsNote(ticketId, to, eventId)
        } catch {
          toastError("SMS sent but the note could not be saved locally.", smsToastOptions)
        }

        setStatus("sent")
        statusRef.current = "sent"
        success(`✓ SMS sent to ${to}`, smsToastOptions)

        if (idleAfterSentRef.current !== null) {
          clearTimeout(idleAfterSentRef.current)
        }
        idleAfterSentRef.current = setTimeout(() => {
          idleAfterSentRef.current = null
          setStatus("idle")
          statusRef.current = "idle"
        }, SMS_SENT_STATUS_RESET_MS)
      } catch {
        setStatus("error")
        toastError("SMS failed to send. Check the mobile number.", smsToastOptions)
        setTimeout(() => {
          setStatus("idle")
          statusRef.current = "idle"
        }, 0)
      } finally {
        inFlightRef.current = false
      }
    },
    [eventId, success, ticketId, toastError]
  )

  return { sendSms, status }
}
