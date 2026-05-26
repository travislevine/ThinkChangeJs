import type { Colour } from "@/lib/constants/colours"
import type { DeviceCategory } from "@/lib/constants/deviceCategories"

export interface PreRegisterDeviceInput {
  deviceType: DeviceCategory
  colour: Colour
}

export interface PreRegisterSubmitRequest {
  patronName: string
  mobile?: string
  email?: string
  devices: PreRegisterDeviceInput[]
  notes?: string
}

export interface PreRegisterStatusResponse {
  open: boolean
  eventName: string | null
}

export interface PreRegisterSubmitSuccessResponse {
  success: true
  smsSent: boolean
}

export interface PreRegisterErrorResponse {
  error: string
}
