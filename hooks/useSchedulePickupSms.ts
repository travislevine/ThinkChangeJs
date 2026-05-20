"use client"

import * as React from "react"

import { useSendSms } from "@/hooks/useSendSms"
import { useToast } from "@/hooks/useToast"
import { AUTO_PATRON_SMS_DELAY_MS } from "@/lib/constants/sms"
import { TOAST_DURATION_SMS_MS } from "@/lib/constants/toastDurations"
import type { SmsPicksByType } from "@/lib/types/sendSms"

export interface SchedulePickupSmsParams {
  ticketId: string
  mobile: string
  ticketNumber: number
  patronName: string | null
  pickedUpAt: number
  picksByType: SmsPicksByType
  allDevicesPickedUp: boolean
}

export interface UseSchedulePickupSmsResult {
  schedulePickupSms: (params: SchedulePickupSmsParams) => void
  cancelScheduledSms: () => void
}

function readNavigatorOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

export function useSchedulePickupSms(): UseSchedulePickupSmsResult {
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

  const schedulePickupSms = React.useCallback(
    (params: SchedulePickupSmsParams) => {
      const mobile = params.mobile.trim()
      if (!mobile) {
        return
      }
      if (!readNavigatorOnline()) {
        toastError(
          "Pick-up SMS was not scheduled — no internet connection.",
          smsToastOptions
        )
        return
      }

      cancelScheduledSms()

      delayRef.current = setTimeout(() => {
        delayRef.current = null
        void sendSms(mobile, params.ticketNumber, params.patronName, {
          variant: "pickup",
          ticketId: params.ticketId,
          pickedUpAt: params.pickedUpAt,
          picksByType: params.picksByType,
          allDevicesPickedUp: params.allDevicesPickedUp,
          silent: true,
        })
      }, AUTO_PATRON_SMS_DELAY_MS)
    },
    [cancelScheduledSms, sendSms, smsToastOptions, toastError]
  )

  return { schedulePickupSms, cancelScheduledSms }
}
