export const DEVICE_CATEGORIES = [
  "Bikes",
  "eBikes",
  "Scooters",
  "eScooters",
  "Skateboards",
  "Wagons",
  "Prams",
  "Other",
] as const

export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number]

