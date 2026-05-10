const DEVICE_UUID_STORAGE_KEY = "bikepark_device_uuid"

function newDeviceUuidV4(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    }
  }
  let t = ""
  for (let i = 0; i < 32; i++) {
    t += ((Math.random() * 16) | 0).toString(16)
  }
  return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`
}

export function getOrCreateDeviceUuid(): string {
  if (typeof window === "undefined") {
    return ""
  }

  const existing = window.localStorage.getItem(DEVICE_UUID_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const created = newDeviceUuidV4()
  window.localStorage.setItem(DEVICE_UUID_STORAGE_KEY, created)
  return created
}
