export type SendSmsStatus = "idle" | "sending" | "sent" | "error"

export interface UseSendSmsResult {
  sendSms: (to: string, ticketNumber: number, patronName: string | null) => Promise<void>
  status: SendSmsStatus
}

export interface SendSmsRequest {
  to: string
  ticketNumber: number
  patronName: string | null
}

export interface SendSmsSuccessResponse {
  success: true
  sid: string
}

export interface SendSmsErrorResponse {
  error: string
}
