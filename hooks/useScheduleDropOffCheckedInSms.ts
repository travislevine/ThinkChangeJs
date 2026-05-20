"use client"

import * as React from "react"

import { useSendSms } from "@/hooks/useSendSms"
import { useToast } from "@/hooks/useToast"
import { DROP_OFF_CHECKED_IN_SMS_DELAY_MS } from "@/lib/constants/sms"
import { TOAST_DURATION_SMS_MS } from "@/lib/constants/toastDurations"

export interface ScheduleDropOffCheckedInSmsParams {
  ticketId: string
  mobile: string
  ticketNumber: number
  patronName: string | null
  checkedInAt: number
}

export interface UseScheduleDropOffCheckedInSmsResult {
  scheduleCheckedInSms: (params: ScheduleDropOffCheckedInSmsParams) => void
  cancelScheduledSms: () => void
}

function readNavigatorOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

export function useScheduleDropOffCheckedInSms(): UseScheduleDropOffCheckedInSmsResult {
  const { sendSms } = useSendSms("")
  const { error: toastError } = useToast()
  const delayRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const smsToastOptions = React.useMemo(
    () => ({ duration: TOAST_DURATION_SMS_MS }),
    []
  )

  const cancelScheduledSms = React.useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
  }, [])

  React.useEffect(() => {
    return () => {
      cancelScheduledSms()
    }
  }, [cancelScheduledSms])

  const scheduleCheckedInSms = React.useCallback(
    (params: ScheduleDropOffCheckedInSmsParams) => {
      const mobile = params.mobile.trim()
      if (!mobile) {
        return
      }
      if (!readNavigatorOnline()) {
        toastError(
          "Checked-in SMS was not scheduled — no internet connection.",
          smsToastOptions
        )
        return
      }

      cancelScheduledSms()

      delayRef.current = setTimeout(() => {
        delayRef.current = null
        void sendSms(mobile, params.ticketNumber, params.patronName, {
          variant: "checked_in",
          ticketId: params.ticketId,
          checkedInAt: params.checkedInAt,
          silent: true,
        })
      }, DROP_OFF_CHECKED_IN_SMS_DELAY_MS)
    },
    [cancelScheduledSms, sendSms, smsToastOptions, toastError]
  )

  return { scheduleCheckedInSms, cancelScheduledSms }
}
