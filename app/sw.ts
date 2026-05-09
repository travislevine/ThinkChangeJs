/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting()
  }
})

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST ?? []), "/"],
  precacheOptions: {
    navigateFallback: "/",
    navigateFallbackDenylist: [/^\/api\//, /^\/_next\//, /^\/sw\.js$/],
    ignoreURLParametersMatching: [/^_rsc$/],
  },
  runtimeCaching: [
    {
      matcher: ({ url: { pathname }, sameOrigin }) => sameOrigin && pathname === "/api/ping",
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }) =>
        request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"),
      handler: new CacheFirst({
        cacheName: "pages-rsc",
        matchOptions: { ignoreSearch: true },
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 })],
      }),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }) =>
        request.headers.get("RSC") === "1" &&
        request.headers.get("Next-Router-Prefetch") === "1" &&
        sameOrigin &&
        !pathname.startsWith("/api/"),
      handler: new CacheFirst({
        cacheName: "pages-rsc-prefetch",
        matchOptions: { ignoreSearch: true },
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 })],
      }),
    },
    ...defaultCache,
  ],
})

serwist.addEventListeners()

