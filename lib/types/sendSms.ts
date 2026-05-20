export type SendSmsStatus = "idle" | "sending" | "sent" | "error"

export type SmsMessageVariant = "ready_for_collection" | "checked_in"

export interface SendSmsOptions {
  variant?: SmsMessageVariant
  ticketId?: string
  /** Unix seconds — required when variant is `checked_in`. */
  checkedInAt?: number
  /** When true, skips Send SMS button state (drop-off auto-send). */
  silent?: boolean
}

export interface UseSendSmsResult {
  sendSms: (
    to: string,
    ticketNumber: number,
    patronName: string | null,
    options?: SendSmsOptions
  ) => Promise<void>
  status: SendSmsStatus
}

export interface SendSmsRequest {
  to: string
  ticketNumber: number
  patronName: string | null
  variant?: SmsMessageVariant
  /** Unix seconds — required when variant is `checked_in`. */
  checkedInAt?: number
}

export interface SendSmsSuccessResponse {
  success: true
  sid: string
}

export interface SendSmsErrorResponse {
  error: string
}

export interface SendSmsButtonProps {
  ticketId: string
  ticketNumber: number
  patronName: string | null
  mobile: string
  isOffline: boolean
}

export interface SendSmsDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  mobile: string
  patronName: string | null
  ticketNumber: number
}
