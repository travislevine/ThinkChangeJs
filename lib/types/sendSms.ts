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
