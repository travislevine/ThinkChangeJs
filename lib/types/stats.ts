import type { DeviceCategory } from "@/lib/constants/deviceCategories"

export interface DeviceCategoryStats {
  category: DeviceCategory
  droppedOff: number
  remaining: number
}

export interface CurrentEventStats {
  totalDroppedOff: number
  devicesRemaining: number
  byCategory: DeviceCategoryStats[]
}

export interface CurrentEventStatsResult {
  stats: CurrentEventStats | null
  isLoading: boolean
  error: string | null
}

