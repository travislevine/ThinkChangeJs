/**
 * PowerSync / WA-SQLite expect the Web Locks API (`navigator.locks`). Browsers only expose it in a
 * secure context (HTTPS or http://localhost). Opening the dev server as http://<lan-ip>:3000 from a
 * phone leaves `navigator.locks` missing — this minimal polyfill allows local SQLite + sync for
 * single-tab / dev use. Prefer HTTPS for real multi-tab safety.
 */
const held: { clientId: string; name: string; mode: "exclusive" }[] = []

function randomUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  let t = ""
  for (let i = 0; i < 32; i++) {
    t += ((Math.random() * 16) | 0).toString(16)
  }
  return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`
}

function createLocksPolyfill(): LockManager {
  return {
    async request(
      name: string,
      optionsOrCallback: LockOptions | LockGrantedCallback<unknown>,
      maybeCallback?: LockGrantedCallback<unknown>
    ): Promise<unknown> {
      let callback: LockGrantedCallback<unknown>
      if (typeof optionsOrCallback === "function") {
        callback = optionsOrCallback
      } else {
        const signal = optionsOrCallback.signal
        if (signal?.aborted) {
          throw new DOMException("The request was aborted.", "AbortError")
        }
        callback = maybeCallback!
      }

      const info = { clientId: "bikepark-locks-polyfill", name, mode: "exclusive" as const }
      held.push(info)
      try {
        const lock: Lock = { mode: "exclusive", name }
        return await Promise.resolve(callback(lock))
      } finally {
        const i = held.indexOf(info)
        if (i >= 0) {
          held.splice(i, 1)
        }
      }
    },
    async query(): Promise<LockManagerSnapshot> {
      return { held: [...held], pending: [] }
    },
  }
}

export function applyInsecureContextClientPolyfills(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return
  }

  // Some browsers (esp. on non-secure origins) omit randomUUID; PowerSync uses it internally.
  if (typeof crypto !== "undefined" && typeof (crypto as Crypto).randomUUID !== "function") {
    try {
      Object.defineProperty(crypto, "randomUUID", {
        value: randomUuidV4,
        configurable: true,
        enumerable: false,
        writable: false,
      })
    } catch {
      // Ignore if we can't patch it.
    }
  }

  const nav = navigator as Navigator & { locks?: LockManager }
  if ("locks" in nav && nav.locks) {
    return
  }

  try {
    Object.defineProperty(nav, "locks", {
      value: createLocksPolyfill(),
      configurable: true,
      enumerable: true,
      writable: false,
    })
  } catch {
    // Some environments may forbid patching navigator; fail silently.
  }
}

applyInsecureContextClientPolyfills()
