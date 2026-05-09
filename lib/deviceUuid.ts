const DEVICE_UUID_STORAGE_KEY = "bikepark_device_uuid"

export function getOrCreateDeviceUuid(): string {
  if (typeof window === "undefined") {
    return ""
  }

  const existing = window.localStorage.getItem(DEVICE_UUID_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const created = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_UUID_STORAGE_KEY, created)
  return created
}
