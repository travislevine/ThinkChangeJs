/** Ask the browser to keep PWA caches when the installed app is closed (Chrome / Edge). */
export function requestPersistentStorage(): void {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return
  }

  void navigator.storage.persist().catch(() => undefined)
}
