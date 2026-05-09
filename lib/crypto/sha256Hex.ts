import { sha256 as sha256Js } from "js-sha256"

/**
 * SHA-256 hex digest. Prefers `crypto.subtle` (fast, hardware-backed) when the
 * page runs in a **secure context** (HTTPS or `http://localhost`). On plain
 * `http://` to a LAN IP, `crypto.subtle` is unavailable — we fall back to a
 * pure JS implementation so PIN hashing still works.
 */
export async function sha256Hex(value: string): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle
    if (!subtle) {
      return sha256Js(value)
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(value)
    const digest = await subtle.digest("SHA-256", data)
    const bytes = new Uint8Array(digest)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  } catch {
    return sha256Js(value)
  }
}
